import sys
from pathlib import Path
from app.rag.pdf_reader import extract_clean_pages

sys.path.append(str(Path(__file__).resolve().parent.parent))
GUIDELINES_DIR = Path(__file__).resolve().parent.parent / "data" / "guidelines"
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "data" / "extracted"


def process_one_pdf(pdf_path: Path, output_path: Path):
    """
    Extracts and cleans text from a PDF and saves it as a TXT file.
    Each page is clearly separated and labeled with its page number.
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

    output_path.write_text(
        "\n".join(output_lines),
        encoding="utf-8"
    )


def main():
    """ Extracts all PDFs from the guidelines folder and writes each PDF to a separate TXT file."""
    if not GUIDELINES_DIR.exists():
        print(f"Could not find folder: {GUIDELINES_DIR}")
        return

    pdf_files = sorted(GUIDELINES_DIR.glob("*.pdf"))

    if not pdf_files:
        print(f"No PDF files found in: {GUIDELINES_DIR}")
        return

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    extracted_count = 0

    for index, pdf_path in enumerate(pdf_files, start=1):
        output_path = OUTPUT_DIR / f"extracted text file {index}.txt"

        try:
            process_one_pdf(pdf_path, output_path)

            extracted_count += 1

            print(
                f"Extracted: {pdf_path.name} "
                f"-> {output_path.name}"
            )

        except Exception as e:
            print(f"ERROR: {pdf_path.name} - {e}")

    print(f"\nExtracted files: {extracted_count}")


if __name__ == "__main__":
    main()
