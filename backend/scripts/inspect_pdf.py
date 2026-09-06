import sys
from pathlib import Path

# Make sure "app" is importable when running this script directly
sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.rag.pdf_reader import extract_clean_pages

GUIDELINES_DIR = Path(__file__).resolve().parent.parent / "data" / "guidelines"
OUTPUT_PATH = Path(__file__).resolve().parent.parent / "data" / "extracted_preview.txt"


def process_one_pdf(pdf_path: Path) -> str:
    """
    Extracts one PDF and formats its pages for the combined output file.
    Args: pdf_path - path to the PDF file.
    Returns: formatted extracted text for that PDF.
    """
    pages = extract_clean_pages(pdf_path)

    output_lines = [
        "#" * 70,
        f"# GUIDELINE: {pdf_path.name}",
        "#" * 70,
        "",
    ]

    for page in pages:
        output_lines.append("=" * 60)
        output_lines.append(f"PAGE {page['page_number']} (cleaned)")
        output_lines.append("=" * 60)
        output_lines.append(page["text"])
        output_lines.append("")

    return "\n".join(output_lines)


def main():
    """
    Extracts all PDFs from the guidelines folder and writes their text to one file.
    Args: none - uses the GUIDELINES_DIR and OUTPUT_PATH constants.
    Returns: None.
    """
    if not GUIDELINES_DIR.exists():
        print(f"Could not find folder: {GUIDELINES_DIR}")
        return

    pdf_files = sorted(GUIDELINES_DIR.glob("*.pdf"))

    if not pdf_files:
        print(f"No PDF files found in: {GUIDELINES_DIR}")
        return

    all_output_blocks = []

    for pdf_path in pdf_files:
        try:
            block = process_one_pdf(pdf_path)
            all_output_blocks.append(block)

            print(f"Extracted: {pdf_path.name}")

        except Exception as e:
            print(f"ERROR: {pdf_path.name} - {e}")

    combined_output = "\n\n".join(all_output_blocks)

    OUTPUT_PATH.write_text(
        combined_output,
        encoding="utf-8"
    )

    print(f"\nExtracted files: {len(all_output_blocks)}")


if __name__ == "__main__":
    main()
