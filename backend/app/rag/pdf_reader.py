from collections import Counter
from pathlib import Path
import fitz


LIGATURES = {
    "ﬁ": "fi",
    "ﬂ": "fl",
    "ﬀ": "ff",
    "ﬃ": "ffi",
    "ﬄ": "ffl",
}


SYMBOL_FIXES = {
    "$": "\u2265",  # >=
    "#": "\u2264",  # <=
    "\x03": "•",    # bullet list marker
}


def normalize_text(text: str) -> str:
    """
    Cleans extracted text by replacing ligatures and known PDF symbol errors.
    Args: text - raw extracted text.
    Returns: normalized text.
    """
    for lig, plain in LIGATURES.items():
        text = text.replace(lig, plain)

    for bad, correct in SYMBOL_FIXES.items():
        text = text.replace(bad, correct)

    return text


def extract_line_text(line: dict) -> str:
    """
    Extracts and normalizes all text from a single PDF line.
    Args: line - a line dictionary from PyMuPDF's text dictionary.
    Returns: cleaned text contained in the line.
    """
    text = "".join(span["text"] for span in line["spans"]).strip()
    return normalize_text(text)


def merge_lines_into_paragraph(lines: list[str]) -> str:
    """
    Joins multiple PDF lines into one flowing paragraph while preserving hyphens.
    Args: lines - list of text lines belonging to the same PDF block.
    Returns: one merged paragraph string.
    """
    result = ""

    for line in lines:
        if not line:
            continue

        if result.endswith("-"):
            result = result + line  # no space, but keep the hyphen
        elif result == "":
            result = line
        else:
            result = result + " " + line

    return result


def get_page_paragraphs(page: fitz.Page, repeated_lines: set[str]) -> list[str]:
    """
    Extracts text from PDF blocks and merges their lines into paragraphs.
    Args: page - PDF page; repeated_lines - headers/footers to remove.
    Returns: list of cleaned paragraph strings from the page.
    """
    paragraphs = []

    for block in page.get_text("dict")["blocks"]:
        if "lines" not in block:
            continue  # image block, skip

        block_lines = []

        for line in block["lines"]:
            text = extract_line_text(line)

            if not text:
                continue

            if text in repeated_lines:
                continue

            block_lines.append(text)

        if not block_lines:
            continue

        paragraph = merge_lines_into_paragraph(block_lines)

        if paragraph.strip():
            paragraphs.append(paragraph)

    return paragraphs


def get_page_lines(page: fitz.Page) -> list[str]:
    """
    Extracts individual text lines from all text blocks on a PDF page.
    Args: page - PDF page to extract text from.
    Returns: list of cleaned text lines in their original order.
    """
    lines = []

    for block in page.get_text("dict")["blocks"]:
        if "lines" not in block:
            continue

        for line in block["lines"]:
            text = extract_line_text(line)

            if text:
                lines.append(text)

    return lines


def find_repeated_lines(doc: fitz.Document, threshold: float = 0.6) -> set[str]:
    """
    Finds lines that repeat across most pages, typically headers or footers.
    Args: doc - PDF document; threshold - minimum fraction of pages containing a line.
    Returns: set of repeated lines that should be removed from content.
    """
    counts = Counter()

    for page in doc:
        lines = get_page_lines(page)
        candidates = lines[:2] + lines[-2:]

        for line in set(candidates):
            counts[line] += 1

    n_pages = len(doc)

    return {
        line
        for line, count in counts.items()
        if count / n_pages > threshold
    }


def find_content_start_page(doc: fitz.Document, marker: str = "Introduction", min_occurrences: int = 2) -> int:
    """
    Finds the first page where the specified content marker appears enough times.
    Args: doc - PDF document; marker - text to search for; min_occurrences - required count.
    Returns: zero-based page index where content starts, or 0 if not found.
    """
    marker_lower = marker.lower()

    for i, page in enumerate(doc):
        count = page.get_text().lower().count(marker_lower)

        if count >= min_occurrences:
            return i

    return 0


def find_content_end_page(doc: fitz.Document, marker: str = "Methods for guideline development") -> int | None:
    """
    Finds the page where the specified end marker occurs.
    Args: doc - PDF document; marker - text marking the end of useful content.
    Returns: zero-based page index, or None if the marker is not found.
    """
    marker_lower = marker.lower()

    matches = [
        i
        for i, page in enumerate(doc)
        if marker_lower in page.get_text().lower()
    ]

    if len(matches) >= 2:
        return matches[1]

    if len(matches) == 1:
        return matches[0]

    return None


def extract_clean_pages(pdf_path: str | Path) -> list[dict]:
    """
    Extracts and cleans the useful content from a PDF, page by page.
    Args: pdf_path - path to the PDF file.
    Returns: list of dictionaries containing page numbers and cleaned text.
    """
    pdf_path = Path(pdf_path)

    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    doc = fitz.open(pdf_path)

    repeated = find_repeated_lines(doc)
    start_page = find_content_start_page(doc)
    end_page = find_content_end_page(doc)

    stop_before = end_page if end_page is not None else len(doc)

    pages = []

    for i in range(start_page, stop_before):
        paragraphs = get_page_paragraphs(doc[i], repeated)
        text = "\n\n".join(paragraphs)

        if text.strip():
            pages.append({
                "page_number": i + 1,
                "text": text
            })

    doc.close()

    return pages


def inspection_report(pdf_path: str | Path) -> dict:
    """
    Inspects the PDF and reports detected pages and repeated header/footer lines.
    Args: pdf_path - path to the PDF file.
    Returns: dictionary containing page counts, content boundaries, and repeated lines.
    """
    pdf_path = Path(pdf_path)

    doc = fitz.open(pdf_path)

    repeated = find_repeated_lines(doc)
    start_page = find_content_start_page(doc)
    end_page = find_content_end_page(doc)
    total_pages = len(doc)

    doc.close()

    return {
        "total_pages": total_pages,
        "content_start_page": start_page + 1,
        "content_end_page": (
            end_page + 1
            if end_page is not None
            else None
        ),
        "repeated_lines_detected": sorted(repeated),
    }