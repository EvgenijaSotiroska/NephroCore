from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, patients
from app.core.config import settings
from app.db.session import Base, engine

# Import models so they're registered on Base before create_all runs.
from app.models import doctor_profile, patient_profile, user  # noqa: F401

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


@app.on_event("startup")
def on_startup():
    # Convenience for local dev. Switch to Alembic migrations before this
    # touches a real database.
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health():
    return {"status": "ok"}
