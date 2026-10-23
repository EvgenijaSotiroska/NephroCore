from functools import lru_cache
from pathlib import Path

from app.ai.build_context import (
    format_medications,
    format_patient_context,
    format_symptoms,
    format_visit_history,
)
from app.models.medication import Medication
from app.models.patient_profile import PatientProfile
from app.models.result import Visit
from app.models.symptom import Symptom
from app.rag.retriever import RetrievedChunk
from app.rag.sources import describe_source

PROMPTS_DIR = Path(__file__).resolve().parent / "prompts"


@lru_cache(maxsize=None)
def load_prompt(name: str) -> str:
    return (PROMPTS_DIR / f"{name}.txt").read_text(encoding="utf-8")

def format_guideline_excerpts(chunks: list[RetrievedChunk]) -> str:
    if not chunks:
        return "None retrieved."
    return "\n\n---\n\n".join(
        f"[Извор {number}] {describe_source(chunk)}\n{chunk.text}"
        for number, chunk in enumerate(chunks, start=1)
    )

LATEST_VISITS_FOR_DOCTOR_ANALYSIS = 3
LATEST_VISITS_FOR_PATIENT_EXPLANATION = 2
LATEST_VISITS_FOR_CHAT = 1


def select_visits_for_analysis(visits: list[Visit], latest: int) -> tuple[list[Visit], str]:
    """The first visit ever plus the `latest` most recent ones, with a sentence telling the model
    what it got. `visits` is oldest first."""
    if len(visits) <= latest + 1:
        return visits, f"All {len(visits)} recorded visits are included."

    skipped = len(visits) - latest - 1
    note = (
        f"The patient has {len(visits)} recorded visits. Only the first visit ever (the baseline) and the "
        f"latest {latest} visits are included; the {skipped} visits in between are "
        f"omitted, so do not treat the gap between the first and the second listed visit as one "
        f"follow-up interval."
    )
    return [visits[0], *visits[-latest:]], note


def build_doctor_analysis_prompt(
    patient: PatientProfile,
    visits: list[Visit],
    symptoms: list[Symptom],
    medications: list[Medication],
    param_labels: dict[str, tuple[str, str]],
    retrieved_chunks: list[RetrievedChunk],
) -> tuple[str, str]:
    """Returns (system_prompt, user_prompt)."""
    system_prompt = load_prompt("system_prompt")
    task_instructions = load_prompt("doctor_analysis_prompt")
    guidelines_text = format_guideline_excerpts(retrieved_chunks)

    # Only the first visit ever (the baseline) and the latest few are sent, to keep the prompt short.
    selected_visits, history_note = select_visits_for_analysis(visits, LATEST_VISITS_FOR_DOCTOR_ANALYSIS)

    user_prompt = (
        f"{task_instructions}\n\n"
        f"PATIENT DATA:\n{format_patient_context(patient)}\n\n"
        f"VISIT HISTORY (chronological, oldest first). {history_note}\n"
        f"{format_visit_history(selected_visits, param_labels)}\n\n"
        f"SYMPTOMS REPORTED BY THE PATIENT SINCE THE LAST VISIT:\n{format_symptoms(symptoms)}\n\n"
        f"CURRENT MEDICATIONS:\n{format_medications(medications)}\n\n"
        f"RELEVANT CLINICAL GUIDELINE EXCERPTS:\n{guidelines_text}\n\n"
        f"Give a clinical analysis focused on the most recent visit in the context of the visit history provided. "
        f"Ground any recommendations in the guideline excerpts above where they apply."
    )
    return system_prompt, user_prompt


def build_patient_explanation_prompt(
    patient: PatientProfile,
    visits: list[Visit],
    symptoms: list[Symptom],
    medications: list[Medication],
    param_labels: dict[str, tuple[str, str]],
    doctor_analysis: str | None = None,
) -> tuple[str, str]:
    """Returns (system_prompt, user_prompt)."""
    system_prompt = load_prompt("system_prompt")
    task_instructions = load_prompt("patient_analysis_prompt")

    analysis_block = doctor_analysis if doctor_analysis else "None available yet."

    selected_visits, history_note = select_visits_for_analysis(visits, LATEST_VISITS_FOR_PATIENT_EXPLANATION)

    user_prompt = (
        f"{task_instructions}\n\n"
        f"PATIENT DATA:\n{format_patient_context(patient)}\n\n"
        f"VISIT HISTORY (chronological, oldest first). {history_note}\n"
        f"{format_visit_history(selected_visits, param_labels)}\n\n"
        f"SYMPTOMS REPORTED BY THE PATIENT SINCE THE LAST VISIT:\n{format_symptoms(symptoms)}\n\n"
        f"CURRENT MEDICATIONS:\n{format_medications(medications)}\n\n"
        f"DOCTOR'S CLINICAL ANALYSIS OF THE MOST RECENT VISIT:\n{analysis_block}\n\n"
        f"Explain the most recent visit to the patient, in the context of their history, "
        f"following the instructions above."
    )
    return system_prompt, user_prompt

def build_chat_system_prompt(
    patient: PatientProfile,
    visits: list[Visit],
    symptoms: list[Symptom],
    medications: list[Medication],
    param_labels: dict[str, tuple[str, str]],
) -> str:
    """The instructions plus the patient's data, sent as the system prompt of every chat message."""
    # Only the first visit ever and the latest one are sent; `visits` is oldest first.
    if visits:
        selected_visits, history_note = select_visits_for_analysis(visits, LATEST_VISITS_FOR_CHAT)
        visit_history = f"{history_note}\n{format_visit_history(selected_visits, param_labels)}"
    else:
        visit_history = "No visits recorded yet."
    return (
        f"{load_prompt('chat_prompt')}\n\n"
        f"PATIENT DATA:\n{format_patient_context(patient)}\n\n"
        f"VISIT HISTORY (chronological, oldest first):\n{visit_history}\n\n"
        f"SYMPTOMS REPORTED BY THE PATIENT (newest first):\n{format_symptoms(symptoms)}\n\n"
        f"CURRENT MEDICATIONS:\n{format_medications(medications)}"
    )