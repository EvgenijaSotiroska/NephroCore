import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.lab_parameters import CKDStage, get_stage_parameter_meta
from app.models.patient_profile import PatientProfile
from app.models.result import LabResult, Visit
from app.schemas.trends import ParameterTrend, PatientTrendsResponse, TrendPoint

router = APIRouter()


def _assert_can_view_patient(patient: PatientProfile, current_user) -> None:
    """Doctor who created the patient, or the patient themself, can view."""
    is_owning_doctor = patient.created_by_doctor_id == current_user.id
    is_the_patient = patient.user_id == current_user.id
    if not (is_owning_doctor or is_the_patient):
        raise HTTPException(status_code=403, detail="Not authorized to view this patient")


def _linear_slope_per_year(points: list[TrendPoint]) -> Optional[float]:
    """Least-squares slope of value vs. time, expressed as change per year."""
    if len(points) < 2:
        return None

    sorted_points = sorted(points, key=lambda p: p.date)
    t0 = sorted_points[0].date
    xs = [(p.date - t0).days / 365.25 for p in sorted_points]
    ys = [p.value for p in sorted_points]

    n = len(xs)
    mean_x = sum(xs) / n
    mean_y = sum(ys) / n
    numerator = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys))
    denominator = sum((x - mean_x) ** 2 for x in xs)

    if denominator == 0:
        return None
    return round(numerator / denominator, 3)


def _stage_from_visit(visit: Visit) -> CKDStage:
    stage = visit.ckd_stage
    return stage if isinstance(stage, CKDStage) else CKDStage(stage)


@router.get("/patients/{patient_id}/trends", response_model=PatientTrendsResponse)
def get_patient_trends(
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
        .filter(Visit.patient_id == patient_id)
        .order_by(Visit.visit_date.asc())
        .all()
    )

    if not visits:
        return PatientTrendsResponse(
            patient_id=patient_id,
            current_ckd_stage=None,
            parameters=[],
        )

    current_stage = _stage_from_visit(visits[-1])

    param_meta_list = get_stage_parameter_meta(current_stage, db)

    parameter_trends: list[ParameterTrend] = []

    for meta in param_meta_list:
        key = meta["key"]
        points: list[TrendPoint] = []
        for visit in visits:
            lab: Optional[LabResult] = visit.lab_result
            if lab is None:
                continue
            raw_value = getattr(lab, key, None)
            if raw_value is None:
                continue
            visit_stage = _stage_from_visit(visit)
            points.append(
                TrendPoint(
                    visit_id=visit.id,
                    date=visit.visit_date,
                    value=float(raw_value),
                    ckd_stage=visit_stage.value,
                )
            )

        if not points:
            continue

        latest = max(points, key=lambda p: p.date)
        is_out_of_range = False
        normal_range = meta["normal_range"]
        if normal_range is not None:
            low, high = normal_range
            is_out_of_range = not (low <= latest.value <= high)

        parameter_trends.append(
            ParameterTrend(
                key=key,
                label=meta["label"],
                unit=meta["unit"],
                category=meta["category"],
                scale=meta["scale"],
                decimals=meta["decimals"],
                normal_range_low=normal_range[0] if normal_range else None,
                normal_range_high=normal_range[1] if normal_range else None,
                higher_is_worse=meta["higher_is_worse"],
                points=points,
                slope_per_year=_linear_slope_per_year(points),
                latest_value=latest.value,
                latest_date=latest.date,
                is_out_of_range=is_out_of_range,
            )
        )


    return PatientTrendsResponse(
        patient_id=patient_id,
        current_ckd_stage=current_stage.value,
        parameters=parameter_trends,
    )