import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
import anthropic

from app.ai.build_prompt import build_doctor_analysis_prompt, build_patient_explanation_prompt
from app.ai.build_context import build_retrieval_query
from app.api.deps import get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models.lab_parameter import LabParameter
from app.models.patient_profile import PatientProfile
from app.models.result import Visit
from app.rag.retriever import retrieve_relevant_chunks
from app.schemas.ai import AIAnalysisResponse

router = APIRouter(prefix="/patients", tags=["ai"])

def _assert_can_view_patient(patient: PatientProfile, current_user) -> None:
    """Doctor who created the patient, or the patient themself, can view."""
    is_owning_doctor = patient.created_by_doctor_id == current_user.id
    is_the_patient = patient.user_id == current_user.id
    if not (is_owning_doctor or is_the_patient):
        raise HTTPException(status_code=403, detail="Not authorized to view this patient")

@router.post("/{patient_id}/ai-analysis", response_model=AIAnalysisResponse)
def generate_ai_analysis(
    patient_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    patient = db.query(PatientProfile).filter(PatientProfile.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    _assert_can_view_patient(patient, current_user)

    visits = (
        db.query(Visit)
        .options(joinedload(Visit.lab_result))
        .filter(Visit.patient_id == patient_id)
        .order_by(Visit.visit_date.asc())
        .all()
    )
    if not visits:
        raise HTTPException(status_code=400, detail="Нема прегледи за анализа")

    lab_parameters = db.query(LabParameter).all()
    param_labels = {row.key: (row.label_en, row.unit) for row in lab_parameters}
    normal_ranges = {
        row.key: (
            float(row.normal_range_low) if row.normal_range_low is not None else None,
            float(row.normal_range_high) if row.normal_range_high is not None else None,
        )
        for row in lab_parameters
    }

    retrieval_query = build_retrieval_query(patient, visits[-1], param_labels, normal_ranges)
    retrieved_chunks = retrieve_relevant_chunks(db, retrieval_query, top_k=5)

    system_prompt, user_prompt = build_doctor_analysis_prompt(patient, visits, param_labels, retrieved_chunks)

    print("=" * 80)
    print("RETRIEVAL QUERY:", retrieval_query)
    print("=" * 80)
    print("SYSTEM PROMPT:")
    print(system_prompt)
    print("=" * 80)
    print("USER PROMPT:")
    print(user_prompt)
    print("=" * 80)

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    try:
        response = client.messages.create(
            model="claude-sonnet-5",
            max_tokens=4096,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
    except anthropic.RateLimitError:
        raise HTTPException(status_code=429, detail="AI сервисот е преоптоварен, обидете се повторно.")
    except anthropic.APIStatusError as e:
        raise HTTPException(status_code=502, detail=f"AI анализата не успеа: {e.message}")
    except anthropic.APIConnectionError:
        raise HTTPException(status_code=502, detail="Не може да се поврзе со AI сервисот.")

    analysis_text = next((b.text for b in response.content if b.type == "text"), "")
    return AIAnalysisResponse(analysis=analysis_text)


@router.post("/{patient_id}/explain-results", response_model=AIAnalysisResponse)
def generate_patient_explanation(
    patient_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    patient = db.query(PatientProfile).filter(PatientProfile.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    _assert_can_view_patient(patient, current_user)

    visits = (
        db.query(Visit)
        .options(joinedload(Visit.lab_result))
        .filter(Visit.patient_id == patient_id)
        .order_by(Visit.visit_date.asc())
        .all()
    )
    if not visits:
        raise HTTPException(status_code=400, detail="Нема прегледи за анализа")

    lab_parameters = db.query(LabParameter).all()
    param_labels = {row.key: (row.label_en, row.unit) for row in lab_parameters}

    # Reuse the doctor's existing analysis for this visit if you're storing it;
    # otherwise pass None and the prompt falls back to reasoning from raw data.
    doctor_analysis = None  # e.g. latest_visit.ai_analysis if you persist it

    system_prompt, user_prompt = build_patient_explanation_prompt(
        patient, visits, param_labels, doctor_analysis
    )

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    try:
        response = client.messages.create(
            model="claude-sonnet-5",
            max_tokens=1024,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
    except anthropic.RateLimitError:
        raise HTTPException(status_code=429, detail="AI сервисот е преоптоварен, обидете се повторно.")
    except anthropic.APIStatusError as e:
        raise HTTPException(status_code=502, detail=f"AI анализата не успеа: {e.message}")
    except anthropic.APIConnectionError:
        raise HTTPException(status_code=502, detail="Не може да се поврзе со AI сервисот.")

    explanation_text = next((b.text for b in response.content if b.type == "text"), "")
    return AIAnalysisResponse(analysis=explanation_text)