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


def parameter_labels_and_ranges(
    lab_parameters, language: str = "en"
) -> tuple[dict[str, tuple[str, str]], dict[str, tuple[float | None, float | None]]]:
    """From the parameter rows: (key -> (label, unit), key -> (normal low, normal high)).
    `language` is "en" or "mk" and decides which label is used."""
    param_labels = {
        row.key: (row.label_mk if language == "mk" else row.label_en, row.unit)
        for row in lab_parameters
    }
    normal_ranges = {
        row.key: (
            float(row.normal_range_low) if row.normal_range_low is not None else None,
            float(row.normal_range_high) if row.normal_range_high is not None else None,
        )
        for row in lab_parameters
    }
    return param_labels, normal_ranges


def _describe_normal_range(low: float | None, high: float | None) -> str | None:
    if low is not None and high is not None:
        return f"{low:g}–{high:g}"
    if low is not None:
        return f"at least {low:g}"
    if high is not None:
        return f"at most {high:g}"
    return None


def format_lab_value(
    label: str,
    unit: str,
    value,
    normal_range: tuple[float | None, float | None] | None,
) -> str:
    """One lab line, with the normal range and a flag when the value is outside it, for example
    'Potassium: 5.6 mmol/L (normal 3.5-5.1) - ABOVE normal'."""
    line = f"{label}: {value} {unit}".rstrip()
    low, high = normal_range if normal_range else (None, None)
    described = _describe_normal_range(low, high)
    if described is None:
        return line

    line += f" (normal {described})"
    if low is not None and float(value) < low:
        line += " — BELOW normal"
    elif high is not None and float(value) > high:
        line += " — ABOVE normal"
    return line


def format_visit_history(
    visits: list[Visit],
    param_labels: dict[str, tuple[str, str]],
    normal_ranges: dict[str, tuple[float | None, float | None]] | None = None,
) -> str:
    normal_ranges = normal_ranges or {}
    blocks = []
    for visit in visits:
        lines = [f"--- Visit: {visit.visit_date} (stage {visit.ckd_stage.value}) ---"]
        if visit.lab_result:
            for key, (label, unit) in param_labels.items():
                value = getattr(visit.lab_result, key, None)
                if value is not None:
                    lines.append(format_lab_value(label, unit, value, normal_ranges.get(key)))
        if visit.notes:
            lines.append(f"Notes: {visit.notes}")
        blocks.append("\n".join(lines))
    return "\n\n".join(blocks)


def describe_time_span(first: date, last: date) -> str:
    """The time between two dates in words, for example 'about 14 months'. Worked out here because
    the model is unreliable at date arithmetic."""
    months = (last.year - first.year) * 12 + (last.month - first.month) - (last.day < first.day)
    if months < 1:
        return "less than a month"
    if months < 24:
        return f"about {months} months"
    years, remaining = divmod(months, 12)
    if remaining == 0:
        return f"about {years} years"
    return f"about {years} years and {remaining} months"


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


# How a patient's cause of CKD is written in the guideline search (empty = leave it out).
ETIOLOGY_PHRASES = {
    "diabetic_nephropathy": "diabetic kidney disease",
    "hypertensive_nephropathy": "hypertensive nephropathy",
    "glomerulonephritis": "glomerulonephritis",
    "polycystic_kidney_disease": "polycystic kidney disease",
    "obstructive_uropathy": "obstructive uropathy",
    "lupus_nephritis": "lupus nephritis",
    "iga_nephropathy": "IgA nephropathy",
}

# One guideline search per topic. A topic is searched when one of its lab parameters was outside
# the normal range in the latest visits.
TOPIC_QUERIES = {
    "hyperkalemia": "Management of hyperkalemia in patients with CKD: potassium binders and continuing RAS inhibitor treatment",
    "acidosis": "Metabolic acidosis in CKD: when to treat with sodium bicarbonate and the target serum bicarbonate",
    "mineral_bone": "CKD-mineral and bone disorder: treatment of high phosphate, low calcium and raised parathyroid hormone, phosphate binders, vitamin D",
    "anemia": "Anemia in CKD: treatment of iron deficiency and when to start erythropoiesis-stimulating agents, hemoglobin targets",
    "albuminuria": "Albuminuria in CKD: therapy to reduce albuminuria and slow the progression of kidney disease",
    "blood_pressure": "Blood pressure targets and antihypertensive treatment in patients with CKD",
    "glycemia": "Glycemic control and glucose-lowering therapy in patients with diabetes and CKD",
}

TOPIC_OF_PARAMETER = {
    "potassium": "hyperkalemia",
    "bicarbonate": "acidosis",
    "phosphate": "mineral_bone",
    "calcium": "mineral_bone",
    "pth": "mineral_bone",
    "vitamin_d": "mineral_bone",
    "alkaline_phosphatase": "mineral_bone",
    "hemoglobin": "anemia",
    "ferritin": "anemia",
    "tsat": "anemia",
    "acr": "albuminuria",
    "bp_systolic": "blood_pressure",
    "bp_diastolic": "blood_pressure",
    "hba1c": "glycemia",
}

# Searched for every patient with diabetes.
DIABETES_THERAPY_QUERY = (
    "Pharmacologic therapy for patients with diabetes and CKD: SGLT2 inhibitors, GLP-1 receptor agonists, "
    "metformin and non-steroidal mineralocorticoid receptor antagonists"
)
# Searched for every patient.
LIFESTYLE_QUERY = (
    "Lifestyle and dietary recommendations for adults with CKD: protein, sodium, potassium, phosphate, "
    "physical activity, smoking and weight"
)
# Searched when the patient is close to kidney failure (stage G4 or G5).
KIDNEY_REPLACEMENT_QUERY = (
    "Preparing for kidney replacement therapy: timing of dialysis access, transplant evaluation "
    "and choice of modality"
)

# Lab values of the latest visits are checked against the normal range for these topics.
VISITS_CHECKED_FOR_TOPICS = 3


def get_out_of_range_keys(
    lab_result,
    normal_ranges: dict[str, tuple[float | None, float | None]],
) -> set[str]:
    """Keys of the lab parameters on this lab result that fall outside their normal range."""
    out_of_range: set[str] = set()
    if lab_result is None:
        return out_of_range
    for key, (low, high) in normal_ranges.items():
        value = getattr(lab_result, key, None)
        if value is None:
            continue
        if low is not None and high is not None and not (low <= float(value) <= high):
            out_of_range.add(key)
    return out_of_range


def build_retrieval_queries(
    patient: PatientProfile,
    visits: list[Visit],
    normal_ranges: dict[str, tuple[float | None, float | None]],
) -> list[str]:
    """The guideline searches for a patient, most important first. `visits` is oldest first and not empty.

    One search for the stage and cause, one for each topic that has an abnormal lab value in the
    latest visits, plus searches for diabetes therapy, lifestyle and kidney replacement planning
    when they apply. One search per topic finds more specific passages than one search that mixes
    everything the patient has.
    """
    latest_visit = visits[-1]
    stage = latest_visit.ckd_stage.value

    cause = ETIOLOGY_PHRASES.get(patient.ckd_etiology.value) if patient.ckd_etiology else None
    stage_query = f"Management of chronic kidney disease, stage {stage}"
    if cause:
        stage_query += f", due to {cause}"
    queries = [stage_query]

    abnormal_keys: set[str] = set()
    for visit in visits[-VISITS_CHECKED_FOR_TOPICS:]:
        abnormal_keys |= get_out_of_range_keys(visit.lab_result, normal_ranges)
    abnormal_topics = {TOPIC_OF_PARAMETER[key] for key in abnormal_keys if key in TOPIC_OF_PARAMETER}
    queries += [query for topic, query in TOPIC_QUERIES.items() if topic in abnormal_topics]

    history = f"{patient.comorbidities or ''} {patient.previous_conditions or ''}".lower()
    has_diabetes = (
        (patient.ckd_etiology is not None and patient.ckd_etiology.value == "diabetic_nephropathy")
        or "diabet" in history
    )
    if has_diabetes:
        queries.append(DIABETES_THERAPY_QUERY)

    queries.append(LIFESTYLE_QUERY)

    if stage in ("G4", "G5"):
        queries.append(KIDNEY_REPLACEMENT_QUERY)

    return queries
