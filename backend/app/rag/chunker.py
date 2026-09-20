from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import tiktoken


PAGE_RE = re.compile(r"^PAGE\s+(\d+)\s+\(cleaned\)\s*$", re.IGNORECASE)

ELEMENT_RE = re.compile(
    r"^(Figure|Table)\s+(\d+)\s*(?:\(pp?\.\s*([^)]*)\))?\s*\|\s*—\s*(.+?)\s*$",
    re.IGNORECASE,
)

ELEMENT_SEARCH_RE = re.compile(
    r"(Figure|Table)\s+(\d+)\s*(?:\(pp?\.\s*([^)]*)\))?\s*\|\s*—\s*(.+?)\s*$",
    re.IGNORECASE,
)

FOOTER_RE = re.compile(r"^S\d+\s*$")
SEPARATOR_RE = re.compile(r"^-{3,}\s*$")

_TOKEN_ENCODER = tiktoken.get_encoding("cl100k_base")


@dataclass
class Block:

    page_number: int
    page_marker: str
    block_type: str
    text: str
    element_number: int | None = None
    element_title: str | None = None
    pdf_page_label: str | None = None


def tokenize(text: str) -> list[int]:
    """
    Convert text into tokens using the cl100k_base tokenizer.
    The resulting token IDs are used to measure chunk sizes consistently throughout the RAG pipeline.
    """
    return _TOKEN_ENCODER.encode(text)


def token_count(text: str) -> int:
    """
    Return the number of cl100k_base tokens contained in the given text.
    This is used to enforce the maximum token size of normal text chunks and to record token counts in the JSONL output.
    """
    return len(tokenize(text))


def detokenize(tokens: list[int]) -> str:
    """
    Convert a list of cl100k_base token IDs back into readable text.
    This is used after splitting token sequences so that generated chunks can be stored and
    retrieved as normal text.
    """
    return _TOKEN_ENCODER.decode(tokens)


def normalize_whitespace(text: str) -> str:
    """
    Clean unnecessary whitespace and empty lines while preserving meaningful line breaks.
    Keeping line breaks is useful for tables, lists, and other structured content that may benefit from its original layout.
    """
    lines = [line.strip() for line in text.splitlines()]
    non_empty = [line for line in lines if line]

    return "\n".join(non_empty).strip()


def parse_polished_file(path: str | Path) -> tuple[str, list[Block]]:
    """
    Parse a polished TXT guideline into logical, page-aware blocks.
    Ordinary text is separated from figures and tables, while page and element metadata is
    preserved for later chunk creation.
    """
    path = Path(path)
    raw_lines = path.read_text(encoding="utf-8").splitlines()

    document_name = path.stem

    for line in raw_lines:
        if line.startswith("# GUIDELINE:"):
            document_name = line.split(":", 1)[1].strip()

            if document_name.lower().endswith(".pdf"):
                document_name = Path(document_name).stem

            break

    blocks: list[Block] = []
    current_page_number: int | None = None
    current_page_marker: str | None = None
    current_pdf_page_label: str | None = None

    ordinary_lines: list[str] = []

    def flush_text() -> None:
        """
        Convert the currently collected ordinary lines into a text block.
        The collected lines are cleared afterward so that text before and after figures or tables remains separated.
        """
        nonlocal ordinary_lines

        cleaned = normalize_whitespace("\n".join(ordinary_lines))
        ordinary_lines = []

        if not cleaned or current_page_number is None:
            return

        blocks.append(
            Block(
                page_number=current_page_number,
                page_marker=current_page_marker or "",
                block_type="text",
                text=cleaned,
                pdf_page_label=current_pdf_page_label,
            )
        )

    i = 0

    while i < len(raw_lines):
        line = raw_lines[i].strip()

        page_match = PAGE_RE.match(line)

        if page_match:
            flush_text()

            current_page_number = int(page_match.group(1))
            current_page_marker = f"PAGE {current_page_number} (cleaned)"
            current_pdf_page_label = None

            i += 1
            continue

        if SEPARATOR_RE.match(line) or FOOTER_RE.match(line):
            if FOOTER_RE.match(line):
                current_pdf_page_label = line

            i += 1
            continue

        element_match = ELEMENT_SEARCH_RE.search(line)

        if element_match and current_page_number is not None:
            prefix = line[:element_match.start()].strip()

            if prefix:
                ordinary_lines.append(prefix)

            flush_text()

            line = line[element_match.start():]
            element_match = ELEMENT_RE.match(line)

            element_type = element_match.group(1).lower()
            element_number = int(element_match.group(2))
            pdf_page_label = element_match.group(3)
            element_title = element_match.group(4).strip()

            element_lines = [line]

            j = i + 1

            while j < len(raw_lines):
                next_line = raw_lines[j].strip()

                if SEPARATOR_RE.match(next_line):
                    break

                element_lines.append(next_line)
                j += 1

            element_text = normalize_whitespace("\n".join(element_lines))

            blocks.append(
                Block(
                    page_number=current_page_number,
                    page_marker=current_page_marker or "",
                    block_type=element_type,
                    text=element_text,
                    element_number=element_number,
                    element_title=element_title,
                    pdf_page_label=pdf_page_label,
                )
            )

            i = j
            continue

        if line.startswith("# GUIDELINE:") or line == "#" * 70:
            i += 1
            continue

        if line:
            ordinary_lines.append(line)

        i += 1

    flush_text()

    return document_name, blocks


def split_text_into_chunks(
    text: str,
    max_tokens: int = 400,
    overlap_tokens: int = 60,
) -> list[tuple[str, int]]:
    """
    Split ordinary text into chunks that do not exceed the configured token limit.
    The method processes text sentence by sentence when possible and keeps a token overlap
     between neighboring chunks so that context is not lost at chunk boundaries.
     """
    if max_tokens <= 0:
        raise ValueError("max_tokens must be > 0")

    if overlap_tokens < 0:
        raise ValueError("overlap_tokens must be >= 0")

    if overlap_tokens >= max_tokens:
        raise ValueError("overlap_tokens must be smaller than max_tokens")

    text = normalize_whitespace(text)

    if not text:
        return []

    sentences = re.split(
        r"(?<=[.!?])\s+(?=[A-Z0-9(])",
        text,
    )

    units = [
        sentence.strip()
        for sentence in sentences
        if sentence.strip()
    ]

    if not units:
        units = [text]

    chunks: list[tuple[str, int]] = []
    current_tokens: list[int] = []

    def emit(tokens) -> None:
        """
        Convert the current token sequence into a text chunk and store its token count.
        Empty token sequences are ignored so that only valid chunks are added to the result.
        """
        if not tokens:
            return

        chunk_text = detokenize(tokens).strip()

        if chunk_text:
            chunks.append((chunk_text, len(tokens)))

    for unit in units:
        unit_tokens = tokenize(unit)
        position = 0

        while position < len(unit_tokens):
            remaining = unit_tokens[position:]

            if not current_tokens:
                take = min(max_tokens, len(remaining))
                current_tokens = list(remaining[:take])
                position += take

                if position < len(unit_tokens):
                    emit(current_tokens)

                    current_tokens = list(
                        current_tokens[
                            -min(overlap_tokens, len(current_tokens)):
                        ]
                    )

                continue

            available = max_tokens - len(current_tokens)

            if len(remaining) <= available:
                current_tokens.extend(remaining)
                position = len(unit_tokens)
                continue

            current_tokens.extend(remaining[:available])
            position += available

            emit(current_tokens)

            current_tokens = list(
                current_tokens[
                    -min(overlap_tokens, len(current_tokens)):
                ]
            )

    emit(current_tokens)

    cleaned: list[tuple[str, int]] = []
    seen: set[str] = set()

    for chunk_text, count in chunks:
        normalized = chunk_text.strip()

        if not normalized or normalized in seen:
            continue

        seen.add(normalized)
        cleaned.append((normalized, count))

    return cleaned


def build_chunks(
    path: str | Path,
    max_tokens: int = 400,
    overlap_tokens: int = 60,
) -> list[dict]:
    """
    Build the final RAG-ready chunk records from one polished TXT file.
    Normal text is split into overlapping chunks, while figures and tables remain atomic and retain their
    element-specific metadata.
    """
    path = Path(path)
    document_name, blocks = parse_polished_file(path)

    document_id = re.sub(
        r"[^a-z0-9]+",
        "_",
        document_name.lower(),
    ).strip("_")

    records: list[dict] = []
    chunk_index = 0

    for block in blocks:
        if block.block_type in {"figure", "table"}:
            text_chunks = [(block.text, token_count(block.text))]
            atomic = True
        else:
            text_chunks = split_text_into_chunks(
                block.text,
                max_tokens=max_tokens,
                overlap_tokens=overlap_tokens,
            )
            atomic = False

        for local_index, (chunk_text, count) in enumerate(text_chunks):
            record = {
                "chunk_id": f"{document_id}_{chunk_index:05d}",
                "document_id": document_id,
                "source_file": path.name,
                "page_number": block.page_number,
                "page_marker": block.page_marker,
                "chunk_type": block.block_type,
                "is_atomic": atomic,
                "chunk_index": chunk_index,
                "page_chunk_index": local_index,
                "token_count": count,
                "text": chunk_text,
            }

            if block.block_type in {"figure", "table"}:
                record["element_number"] = block.element_number
                record["element_title"] = block.element_title

                if block.pdf_page_label:
                    record["pdf_page_label"] = block.pdf_page_label

            records.append(record)
            chunk_index += 1

    return records


def write_jsonl(
    records: Iterable[dict],
    output_path: str | Path,
) -> None:
    """
    Write chunk records to a UTF-8 JSONL file, with one JSON object per line.
    The output directory is created automatically if it does not already exist.
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with output_path.open("w", encoding="utf-8") as f:
        for record in records:
            f.write(
                json.dumps(
                    record,
                    ensure_ascii=False,
                )
                + "\n"
            )


def chunk_file(
    input_path: str | Path,
    output_path: str | Path,
    max_tokens: int = 400,
    overlap_tokens: int = 60,
) -> list[dict]:
    """
    Process one polished TXT file into RAG chunks and save the resulting records as JSONL.
    It returns the generated records as a list so they can also be inspected or processed immediately in Python.
    """
    records = build_chunks(
        input_path,
        max_tokens=max_tokens,
        overlap_tokens=overlap_tokens,
    )

    write_jsonl(records, output_path)

    return records