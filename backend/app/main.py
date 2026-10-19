from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import ai, auth, patients, results, trends, appointment, symptoms, medications, doctors, chat
from app.core.config import settings

from app.models import doctor_profile, patient_profile, user, result  # noqa: F401

app = FastAPI(title="NephroCore API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(results.router)
app.include_router(trends.router)
app.include_router(ai.router)
app.include_router(appointment.router)
app.include_router(symptoms.router)
app.include_router(medications.router)
app.include_router(doctors.router)
app.include_router(chat.router)


# The database schema is created and updated by Alembic only: run `alembic upgrade head`.

@app.get("/health")
def health():
    return {"status": "ok"}