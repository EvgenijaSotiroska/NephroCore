from functools import lru_cache
from pathlib import Path

from app.ai.build_context import format_patient_context, format_visit_history
from app.models.patient_profile import PatientProfile
from app.models.result import Visit

PROMPTS_DIR = Path(__file__).resolve().parent / "prompts"


@lru_cache(maxsize=None)
def load_prompt(name: str) -> str:
    return (PROMPTS_DIR / f"{name}.txt").read_text(encoding="utf-8")


def build_doctor_analysis_prompt(
    patient: PatientProfile,
    visits: list[Visit],
    param_labels: dict[str, tuple[str, str]],
    retrieved_chunks: list[str],
) -> tuple[str, str]:
    """Returns (system_prompt, user_prompt)."""
    system_prompt = load_prompt("system_prompt")
    task_instructions = load_prompt("doctor_analysis_prompt")
    guidelines_text = "\n\n---\n\n".join(retrieved_chunks) if retrieved_chunks else "None retrieved."

    user_prompt = (
        f"{task_instructions}\n\n"
        f"PATIENT DATA:\n{format_patient_context(patient)}\n\n"
        f"VISIT HISTORY (chronological, oldest first):\n{format_visit_history(visits, param_labels)}\n\n"
        f"RELEVANT CLINICAL GUIDELINE EXCERPTS:\n{guidelines_text}\n\n"
        f"Give a clinical analysis focused on the most recent visit in the context of the full history. "
        f"Ground any recommendations in the guideline excerpts above where they apply."
    )
    return system_prompt, user_prompt