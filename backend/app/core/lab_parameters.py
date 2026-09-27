from enum import Enum

from sqlalchemy.orm import Session


class CKDStage(str, Enum):
    G1 = "G1"
    G2 = "G2"
    G3A = "G3A"
    G3B = "G3B"
    G4 = "G4"
    G5 = "G5"


def get_stage_parameter_definitions(stage: CKDStage, db: Session) -> list[dict]:
    """Return [{key, value_type, label_mk, unit, reference_mk}, ...] for the
    entry-form catalog, in display order."""
    from app.models.lab_parameter import LabParameter, ParameterStage

    rows = (
        db.query(LabParameter)
        .join(ParameterStage, ParameterStage.parameter_key == LabParameter.key)
        .filter(ParameterStage.stage == stage)
        .order_by(LabParameter.display_order)
        .all()
    )
    return [
        {
            "key": row.key,
            "value_type": row.value_type.value,
            "label_mk": row.label_mk,
            "unit": row.unit,
            "reference_mk": row.reference_mk or "",
        }
        for row in rows
    ]


def get_stage_parameter_meta(stage: CKDStage, db: Session) -> list[dict]:
    """Same rows, merged with full chart metadata — this is what the
    /trends endpoint iterates over."""
    from app.models.lab_parameter import LabParameter, ParameterStage

    rows = (
        db.query(LabParameter)
        .join(ParameterStage, ParameterStage.parameter_key == LabParameter.key)
        .filter(ParameterStage.stage == stage)
        .order_by(LabParameter.display_order)
        .all()
    )
    return [
        {
            "key": row.key,
            "value_type": row.value_type.value,
            "label": row.label_mk,
            "unit": row.unit,
            "category": row.category_mk,
            "normal_range": (
                (float(row.normal_range_low), float(row.normal_range_high))
                if row.normal_range_low is not None and row.normal_range_high is not None
                else None
            ),
            "scale": row.scale.value,
            "higher_is_worse": row.higher_is_worse,
            "decimals": row.decimals,
        }
        for row in rows
    ]