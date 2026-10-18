from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.lab_parameter import LabParameter, ParameterStage
from app.models.result import CKDStage


def _parameters_for_stage(stage: CKDStage, db: Session) -> list[LabParameter]:
    """The parameters that apply to one CKD stage, in display order."""
    return list(
        db.scalars(
            select(LabParameter)
            .join(ParameterStage, ParameterStage.parameter_key == LabParameter.key)
            .where(ParameterStage.stage == stage)
            .order_by(LabParameter.display_order)
        )
    )


def _to_definition(row: LabParameter) -> dict:
    """What the entry form needs for one parameter."""
    return {
        "key": row.key,
        "value_type": row.value_type.value,
        "label_mk": row.label_mk,
        "unit": row.unit,
        "reference_mk": row.reference_mk or "",
    }


def get_stage_parameter_definitions(stage: CKDStage, db: Session) -> list[dict]:
    """Return [{key, value_type, label_mk, unit, reference_mk}, ...] for the
    entry-form catalog, in display order."""
    return [_to_definition(row) for row in _parameters_for_stage(stage, db)]


def get_stage_parameter_meta(stage: CKDStage, db: Session) -> list[dict]:
    """Same rows, merged with full chart metadata - this is what the
    /trends endpoint iterates over."""
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
        for row in _parameters_for_stage(stage, db)
    ]


def get_all_parameters(db: Session) -> list[dict]:
    """Every parameter in the catalog, regardless of stage - powers the
    entry form's 'add another parameter' picker."""
    rows = db.scalars(select(LabParameter).order_by(LabParameter.display_order))
    return [_to_definition(row) for row in rows]
