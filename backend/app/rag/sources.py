import re
from dataclasses import dataclass

from app.rag.retriever import RetrievedChunk


@dataclass(frozen=True)
class GuidelineDocument:
    title: str
    filename: str  # the PDF in data/guidelines/


# document_id is the slug the chunker made from the PDF name (see rag/chunker.py).
GUIDELINE_DOCUMENTS = {
    "kdigo_2024_ckd_guideline": GuidelineDocument(
        "KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of CKD",
        "KDIGO-2024-CKD-Guideline.pdf",
    ),
    "kdigo_2022_clinical_practice_guideline_for_diabetes_management_in_ckd": GuidelineDocument(
        "KDIGO 2022 Clinical Practice Guideline for Diabetes Management in CKD",
        "KDIGO-2022-Clinical-Practice-Guideline-for-Diabetes-Management-in-CKD.pdf",
    ),
    "kdigo_2021_blood_pressure_in_ckd_guideline": GuidelineDocument(
        "KDIGO 2021 Clinical Practice Guideline for the Management of Blood Pressure in CKD",
        "KDIGO-2021-Blood-Pressure-in-CKD-Guideline.pdf",
    ),
    "anemia_2026": GuidelineDocument(
        "KDIGO Clinical Practice Guideline for Anemia in CKD (2026)",
        "anemia_2026.pdf",
    ),
}

_CITATION = re.compile(r"\[Извор\s+([\d,\s]+)\]")


def describe_source(chunk: RetrievedChunk) -> str:
    """Document and page of a chunk, for example 'KDIGO 2024 ..., PDF стр. 21 (печатена стр. S136)'."""
    document = GUIDELINE_DOCUMENTS.get(chunk.document_id)
    parts = [document.title if document else chunk.document_id]
    if chunk.page_number:
        parts.append(f"PDF стр. {chunk.page_number}")
    if chunk.pdf_page_label:
        parts.append(f"(печатена стр. {chunk.pdf_page_label})")
    return ", ".join(parts)


_BRACKET = re.compile(r"\[([^\]]*)\]")


def append_sources(answer: str, chunks: list[RetrievedChunk]) -> str:
    """Add an ИЗВОРИ list with the document and page of every excerpt the answer cited."""
    cited: set[int] = set()
    for bracket in _BRACKET.findall(answer):
        if "Извор" not in bracket:
            continue
        for number in re.findall(r"\d+", bracket):
            if 1 <= int(number) <= len(chunks):
                cited.add(int(number))

    if not cited:
        return answer

    lines = [f"[Извор {n}] {describe_source(chunks[n - 1])}" for n in sorted(cited)]
    return f"{answer}\n\nИЗВОРИ\n" + "\n".join(lines)