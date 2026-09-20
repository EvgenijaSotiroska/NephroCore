from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from app.rag.chunker import build_chunks, write_jsonl

sys.path.append(str(Path(__file__).resolve().parent.parent))


BACKEND_DIR = Path(__file__).resolve().parent.parent
POLISHED_DIR = BACKEND_DIR / "data" / "polished"
OUTPUT_DIR = BACKEND_DIR / "data" / "chunks"


def parse_args() -> argparse.Namespace:
    """Parses the maximum chunk size and token overlap from command-line arguments."""
    parser = argparse.ArgumentParser(
        description="Chunk polished guideline text files for RAG."
    )

    parser.add_argument(
        "--max-tokens",
        type=int,
        default=400,
        help="Maximum tokens for ordinary text chunks (default: 400).",
    )

    parser.add_argument(
        "--overlap",
        type=int,
        default=60,
        help="Token overlap between ordinary text chunks (default: 60).",
    )

    return parser.parse_args()


def count_types(records: list[dict]) -> dict[str, int]:
    """Counts how many text, figure, and table chunks are present."""
    counts = {"text": 0, "figure": 0, "table": 0}

    for record in records:
        counts[record["chunk_type"]] = (
            counts.get(record["chunk_type"], 0) + 1
        )

    return counts


def main() -> None:
    """Chunks all polished guideline files and writes the results as JSONL files."""
    args = parse_args()

    if not POLISHED_DIR.exists():
        print(f"Could not find polished directory: {POLISHED_DIR}")
        return

    txt_files = sorted(
        p for p in POLISHED_DIR.glob("*.txt")
        if p.is_file()
    )

    if not txt_files:
        print(f"No TXT files found in: {POLISHED_DIR}")
        return

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    all_records: list[dict] = []
    successful_files = 0

    for txt_path in txt_files:
        try:
            records = build_chunks(
                txt_path,
                max_tokens=args.max_tokens,
                overlap_tokens=args.overlap,
            )

            if records:
                document_id = records[0]["document_id"]
            else:
                document_id = txt_path.stem

            output_path = OUTPUT_DIR / f"{document_id}.jsonl"
            write_jsonl(records, output_path)

            all_records.extend(records)
            successful_files += 1

        except Exception as exc:
            print(
                f"[ERROR] {txt_path.name}: {exc}",
                file=sys.stderr,
            )

    combined_path = OUTPUT_DIR / "all_chunks.jsonl"
    write_jsonl(all_records, combined_path)

    print(f"Chunking done for {successful_files} files.")
    print(f"Number of chunks: {len(all_records)}")


if __name__ == "__main__":
    main()