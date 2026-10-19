import uuid

import openai
from fastapi import APIRouter, Depends, HTTPException, status
from openai import OpenAI
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.ai.build_prompt import build_chat_system_prompt
from app.api.deps import get_own_patient_profile, require_patient
from app.core.config import settings
from app.core.rate_limit import chat_limiter
from app.db.session import get_db
from app.models.lab_parameter import LabParameter
from app.models.medication import Medication
from app.models.result import Visit
from app.models.symptom import Symptom
from app.models.user import User
from app.schemas.chat import ChatReply, ChatRequest

router = APIRouter(prefix="/patients", tags=["chat"])

CHAT_TIMEOUT_SECONDS = 60
CHAT_MAX_OUTPUT_TOKENS = 3000
MAX_SYMPTOMS_IN_PROMPT = 30
CHAT_MODEL = "gpt-4o-mini"

# If the last question contains one of these, a fixed warning is put in front of the answer,
# so the warning does not depend on the AI.
EMERGENCY_PHRASES = (
    "болка во градите",
    "болка во градниот кош",
    "не можам да дишам",
    "тешко дишење",
    "недостиг на воздух",
    "губење на свест",
    "изгубив свест",
    "несвестица",
    "не мокрам",
    "нема мокрење",
    "конвулзии",
    "силна слабост",
)
EMERGENCY_NOTICE = (
    "ВАЖНО: Ако имате силна болка во градите, тешко дишење, несвестица или друг алармантен симптом, "
    "веднаш јавете се на брза помош (194 или 112) или контактирајте го вашиот лекар. "
    "Овој асистент не може да помогне во итни случаи.\n\n"
)


def _load_visits(db: Session, patient_id: uuid.UUID) -> list[Visit]:
    """All visits of the patient, oldest first (an empty list is fine for the chat)."""
    return list(
        db.scalars(
            select(Visit)
            .options(joinedload(Visit.lab_result))
            .where(Visit.patient_id == patient_id)
            .order_by(Visit.visit_date.asc())
        ).all()
    )


def _load_recent_symptoms(db: Session, patient_id: uuid.UUID) -> list[Symptom]:
    """The patient's most recent symptoms, newest first."""
    return list(
        db.scalars(
            select(Symptom)
            .where(Symptom.patient_id == patient_id)
            .order_by(Symptom.symptom_date.desc())
            .limit(MAX_SYMPTOMS_IN_PROMPT)
        )
    )


def _load_active_medications(db: Session, patient_id: uuid.UUID) -> list[Medication]:
    return list(
        db.scalars(
            select(Medication)
            .where(Medication.patient_id == patient_id, Medication.is_active.is_(True))
            .order_by(Medication.name)
        )
    )


def _ask_openai(system_prompt: str, payload: ChatRequest) -> str:
    """Send the conversation to OpenAI and return the text of the answer."""
    if not settings.OPENAI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The assistant is not available right now.",
        )

    client = OpenAI(api_key=settings.OPENAI_API_KEY, timeout=CHAT_TIMEOUT_SECONDS, max_retries=1)
    try:
        response = client.responses.create(
            model=CHAT_MODEL,
            instructions=system_prompt,
            input=[{"role": m.role, "content": m.content} for m in payload.messages],
            max_output_tokens=CHAT_MAX_OUTPUT_TOKENS,
            store=False,  # ask OpenAI not to keep this conversation
        )
    except openai.RateLimitError:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="The assistant is busy. Try again in a moment.",
        )
    # A timeout is a kind of connection error, so it must be caught before it.
    except openai.APITimeoutError:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="The assistant took too long to answer. Try again.",
        )
    except openai.APIStatusError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The assistant could not answer. Try again later.",
        )
    except openai.APIConnectionError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not connect to the assistant.",
        )

    text = response.output_text or ""
    if response.status == "incomplete":
        text += "\n\n[Одговорот е скратен поради должина. Поставете го прашањето пократко или повторно.]"
    return text


@router.post("/{patient_id}/chat", response_model=ChatReply)
def chat_with_assistant(
    patient_id: uuid.UUID,
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_patient: User = Depends(require_patient),
):
    """One chat message. Patients only, about themself. Nothing is stored on the server."""
    patient = get_own_patient_profile(db, current_patient)
    if patient.id != patient_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")
    chat_limiter.check_and_hit(f"chat:{current_patient.id}")

    visits = _load_visits(db, patient_id)
    symptoms = _load_recent_symptoms(db, patient_id)
    medications = _load_active_medications(db, patient_id)

    lab_parameters = db.scalars(select(LabParameter)).all()
    param_labels = {row.key: (row.label_en, row.unit) for row in lab_parameters}

    system_prompt = build_chat_system_prompt(patient, visits, symptoms, medications, param_labels)
    reply = _ask_openai(system_prompt, payload)

    last_question = payload.messages[-1].content.lower()
    if any(phrase in last_question for phrase in EMERGENCY_PHRASES):
        reply = EMERGENCY_NOTICE + reply

    return ChatReply(reply=reply)