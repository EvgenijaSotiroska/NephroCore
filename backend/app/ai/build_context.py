from datetime import date, datetime

from app.core.config import CLINIC_TZ
from app.models.medication import Medication
from app.models.patient_profile import PatientProfile
from app.models.result import Visit
from app.models.symptom import Symptom


def _years_since(value: date) -> int:
    today = datetime.now(CLINIC_TZ).date()
    return today.year - value.year - ((today.month, today.day) < (value.month, value.day))


def format_patient_context(patient: PatientProfile) -> str:
    lines = [f"Sex: {patient.sex.value}"]
    if patient.date_of_birth:
        lines.append(f"Age: {_years_since(patient.date_of_birth)} years")
    if patient.ckd_etiology:
        lines.append(f"CKD etiology: {patient.ckd_etiology.value}")
    if patient.diagnosis_date:
        lines.append(f"Years since diagnosis: {_years_since(patient.diagnosis_date)}")
    if patient.baseline_egfr:
        lines.append(f"Baseline eGFR: {patient.baseline_egfr}")
    lines.append(f"Dialysis status: {patient.dialysis_status.value}")
    if patient.comorbidities:
        lines.append(f"Comorbidities: {patient.comorbidities}")
    if patient.previous_conditions:
        lines.append(f"Previous conditions: {patient.previous_conditions}")
    if patient.current_medications:
        lines.append(f"Current medications: {patient.current_medications}")
    return "\n".join(lines)


def format_visit_history(visits: list[Visit], param_labels: dict[str, tuple[str, str]]) -> str:
    blocks = []
    for visit in visits:
        lines = [f"--- Visit: {visit.visit_date} (stage {visit.ckd_stage.value}) ---"]
        if visit.lab_result:
            for key, (label, unit) in param_labels.items():
                value = getattr(visit.lab_result, key, None)
                if value is not None:
                    lines.append(f"{label}: {value} {unit}")
        if visit.notes:
            lines.append(f"Notes: {visit.notes}")
        blocks.append("\n".join(lines))
    return "\n\n".join(blocks)


def format_symptoms(symptoms: list[Symptom]) -> str:
    """Symptoms the patient reported since the last visit, newest first."""
    if not symptoms:
        return "None reported."
    return "\n".join(
        f"- {symptom.symptom_date} ({symptom.intensity.value} intensity): {symptom.description}"
        for symptom in symptoms
    )


def format_medications(medications: list[Medication]) -> str:
    """The patient's current (active) medications."""
    if not medications:
        return "None recorded."
    lines = []
    for medication in medications:
        times = ", ".join(time.strftime("%H:%M") for time in medication.times)
        line = f"- {medication.name}, {medication.dose}, taken at {times}"
        if medication.description:
            line += f" (purpose: {medication.description})"
        lines.append(line)
    return "\n".join(lines)


def get_out_of_range_labels(
    lab_result,
    param_labels: dict[str, tuple[str, str]],
    normal_ranges: dict[str, tuple[float | None, float | None]],
) -> list[str]:
    """Labels of every parameter on this lab result that falls outside its
    normal range — used to steer RAG retrieval toward whichever guideline
    is actually relevant to what's wrong with the patient right now."""
    out_of_range = []
    if lab_result is None:
        return out_of_range
    for key, (label, _unit) in param_labels.items():
        value = getattr(lab_result, key, None)
        if value is None:
            continue
        low, high = normal_ranges.get(key, (None, None))
        if low is not None and high is not None and not (low <= float(value) <= high):
            out_of_range.append(label)
    return out_of_range


def build_retrieval_query(
    patient: PatientProfile,
    latest_visit: Visit,
    param_labels: dict[str, tuple[str, str]],
    normal_ranges: dict[str, tuple[float | None, float | None]],
) -> str:
    etiology = patient.ckd_etiology.value if patient.ckd_etiology else "unspecified etiology"
    stage = latest_visit.ckd_stage.value
    out_of_range = get_out_of_range_labels(latest_visit.lab_result, param_labels, normal_ranges)

    parts = [f"CKD stage {stage} due to {etiology}."]
    if out_of_range:
        parts.append(f"Current concerns: {', '.join(out_of_range)}.")
    if patient.comorbidities:
        parts.append(f"Comorbidities: {patient.comorbidities}.")
    return " ".join(parts)