import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload
import anthropic
import openai

from app.ai.build_prompt import build_doctor_analysis_prompt, build_patient_explanation_prompt
from app.ai.build_context import build_retrieval_query
from app.api.deps import get_own_patient_profile, get_owned_patient, require_doctor, require_patient
from app.core.config import settings
from app.core.rate_limit import ai_limiter
from app.db.session import get_db
from app.models.ai_analysis import AIAnalysis, AIAnalysisKind
from app.models.lab_parameter import LabParameter
from app.models.medication import Medication
from app.models.result import Visit
from app.models.symptom import Symptom
from app.models.user import User
from app.rag.retriever import retrieve_relevant_chunks
from app.schemas.ai import AIAnalysisResponse
from app.rag.sources import append_sources

router = APIRouter(prefix="/patients", tags=["ai"])

CLAUDE_TIMEOUT_SECONDS = 180
CLAUDE_RETRY_TIMEOUT_SECONDS = 90
MAX_SYMPTOMS_IN_PROMPT = 30
MAX_SAVED_ANALYSES_RETURNED = 50
# Macedonian (Cyrillic) text needs many more tokens than English, so this is generous.
DOCTOR_ANALYSIS_MAX_TOKENS = 8000
PATIENT_EXPLANATION_MAX_TOKENS = 4000


def _load_visits(db: Session, patient_id: uuid.UUID) -> list[Visit]:
    """All visits of the patient, oldest first, or 400 if there are none."""
    visits = db.scalars(
        select(Visit)
        .options(joinedload(Visit.lab_result))
        .where(Visit.patient_id == patient_id)
        .order_by(Visit.visit_date.asc())
    ).all()
    if not visits:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="There are no visits to analyse.")
    return visits


def _load_symptoms_since_last_visit(db: Session, patient_id: uuid.UUID, visits: list[Visit]) -> list[Symptom]:
    """Symptoms reported on or after the most recent visit, newest first."""
    return list(
        db.scalars(
            select(Symptom)
            .where(Symptom.patient_id == patient_id, Symptom.symptom_date >= visits[-1].visit_date)
            .order_by(Symptom.symptom_date.desc())
            .limit(MAX_SYMPTOMS_IN_PROMPT)
        )
    )


def _load_active_medications(db: Session, patient_id: uuid.UUID) -> list[Medication]:
    """The patient's current medications."""
    return list(
        db.scalars(
            select(Medication)
            .where(Medication.patient_id == patient_id, Medication.is_active.is_(True))
            .order_by(Medication.name)
        )
    )


def _save_analysis(
    db: Session, patient_id: uuid.UUID, author: User, kind: AIAnalysisKind, text: str
) -> AIAnalysis:
    """Store one generated analysis so it can be opened again later."""
    row = AIAnalysis(patient_id=patient_id, author_id=author.id, kind=kind, analysis=text)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def _load_saved(db: Session, patient_id: uuid.UUID, kind: AIAnalysisKind) -> list[AIAnalysis]:
    """Saved analyses of one kind for this patient, newest first."""
    return list(
        db.scalars(
            select(AIAnalysis)
            .where(AIAnalysis.patient_id == patient_id, AIAnalysis.kind == kind)
            .order_by(AIAnalysis.created_at.desc())
            .limit(MAX_SAVED_ANALYSES_RETURNED)
        )
    )


def _ask_claude(system_prompt: str, user_prompt: str, max_tokens: int) -> str:
    """Send the prompts to Claude and return the text of the answer."""
    # The first try waits up to CLAUDE_TIMEOUT_SECONDS. If it fails for a temporary reason, one more
    # try is made that waits up to CLAUDE_RETRY_TIMEOUT_SECONDS.
    response = None
    for attempt, timeout in enumerate((CLAUDE_TIMEOUT_SECONDS, CLAUDE_RETRY_TIMEOUT_SECONDS)):
        is_last_attempt = attempt == 1
        client = anthropic.Anthropic(
            api_key=settings.ANTHROPIC_API_KEY,
            timeout=timeout,
            max_retries=0,
        )
        try:
            response = client.messages.create(
                model="claude-sonnet-5",
                max_tokens=max_tokens,
                system=system_prompt,
                messages=[{"role": "user", "content": user_prompt}],
            )
            break
        # A busy service is not retried straight away: that would only be refused again.
        except anthropic.RateLimitError:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="The AI service is busy. Try again in a moment.",
            )
        # A timeout is a kind of connection error, so it must be caught before it.
        except anthropic.APITimeoutError:
            if is_last_attempt:
                raise HTTPException(
                    status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                    detail="The AI service took too long to answer. Try again.",
                )
        # The provider's own error text is not shown to users (it can contain billing or key details).
        # Only server-side errors (5xx) are worth a second try; a 4xx would fail the same way again.
        except anthropic.APIStatusError as error:
            if is_last_attempt or error.status_code < 500:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="The AI analysis failed. Try again later.",
                )
        except anthropic.APIConnectionError:
            if is_last_attempt:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Could not connect to the AI service.",
                )

    text = next((b.text for b in response.content if b.type == "text"), "")
    if response.stop_reason == "max_tokens":
        text += "\n\n[Одговорот е скратен поради должина. Притиснете „Генерирај повторно“.]"
    return text


@router.get("/{patient_id}/ai-analysis", response_model=list[AIAnalysisResponse])
def list_ai_analyses(
    patient_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_doctor: User = Depends(require_doctor),
):
    """Earlier clinical analyses of this patient. Doctors only, for their own patients."""
    get_owned_patient(db, patient_id, current_doctor)
    return _load_saved(db, patient_id, AIAnalysisKind.DOCTOR)


@router.post("/{patient_id}/ai-analysis", response_model=AIAnalysisResponse)
def generate_ai_analysis(
    patient_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_doctor: User = Depends(require_doctor),
):
    """Clinical analysis written for the doctor. Doctors only, for their own patients."""
    patient = get_owned_patient(db, patient_id, current_doctor)
    ai_limiter.check_and_hit(f"ai:{current_doctor.id}")

    visits = _load_visits(db, patient_id)

    lab_parameters = db.scalars(select(LabParameter)).all()
    param_labels = {row.key: (row.label_en, row.unit) for row in lab_parameters}
    normal_ranges = {
        row.key: (
            float(row.normal_range_low) if row.normal_range_low is not None else None,
            float(row.normal_range_high) if row.normal_range_high is not None else None,
        )
        for row in lab_parameters
    }

    retrieval_query = build_retrieval_query(patient, visits[-1], param_labels, normal_ranges)
    try:
        retrieved_chunks = retrieve_relevant_chunks(db, retrieval_query, top_k=5)
    except openai.OpenAIError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The guideline search is unavailable. Try again later.",
        )

    symptoms = _load_symptoms_since_last_visit(db, patient_id, visits)
    medications = _load_active_medications(db, patient_id)

    system_prompt, user_prompt = build_doctor_analysis_prompt(
        patient, visits, symptoms, medications, param_labels, retrieved_chunks
    )

    # Everything needed is now plain text. Give the connection back to the pool while waiting for
    # Claude; saving the answer below opens a new one.
    db.close()

    text = _ask_claude(system_prompt, user_prompt, max_tokens=DOCTOR_ANALYSIS_MAX_TOKENS)
    text = append_sources(text, retrieved_chunks)
    return _save_analysis(db, patient_id, current_doctor, AIAnalysisKind.DOCTOR, text)


@router.get("/{patient_id}/explain-results", response_model=list[AIAnalysisResponse])
def list_patient_explanations(
    patient_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_patient: User = Depends(require_patient),
):
    """Earlier explanations of the patient's own results. Patients only, about themself."""
    patient = get_own_patient_profile(db, current_patient)
    if patient.id != patient_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")
    return _load_saved(db, patient_id, AIAnalysisKind.PATIENT)


@router.post("/{patient_id}/explain-results", response_model=AIAnalysisResponse)
def generate_patient_explanation(
    patient_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_patient: User = Depends(require_patient),
):
    """Plain-language explanation written for the patient. Patients only, about themself."""
    patient = get_own_patient_profile(db, current_patient)
    if patient.id != patient_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")
    ai_limiter.check_and_hit(f"ai:{current_patient.id}")

    visits = _load_visits(db, patient_id)

    lab_parameters = db.scalars(select(LabParameter)).all()
    param_labels = {row.key: (row.label_en, row.unit) for row in lab_parameters}

    doctor_analysis = None

    symptoms = _load_symptoms_since_last_visit(db, patient_id, visits)
    medications = _load_active_medications(db, patient_id)

    system_prompt, user_prompt = build_patient_explanation_prompt(
        patient, visits, symptoms, medications, param_labels, doctor_analysis
    )

    # Everything needed is now plain text. Give the connection back to the pool while waiting for
    # Claude; saving the answer below opens a new one.
    db.close()

    text = _ask_claude(system_prompt, user_prompt, max_tokens=PATIENT_EXPLANATION_MAX_TOKENS)
    return _save_analysis(db, patient_id, current_patient, AIAnalysisKind.PATIENT, text)