from enum import Enum


class CKDStage(str, Enum):
    G1 = "G1"
    G2 = "G2"
    G3A = "G3A"
    G3B = "G3B"
    G4 = "G4"
    G5 = "G5"


# value_type is used for basic request validation / OpenAPI typing only.
PARAMETER_VALUE_TYPES = {
    "egfr": "float",
    "creatinine": "float",
    "acr": "float",
    "bp_systolic": "int",
    "bp_diastolic": "int",
    "phosphate": "float",
    "calcium": "float",
    "hemoglobin": "float",
    "potassium": "float",
    "pth": "float",
    "bicarbonate": "float",
    "urea": "float",
    "albumin": "float",
}

STAGE_PARAMETERS = {
    CKDStage.G1: ["egfr", "creatinine", "acr", "bp_systolic", "bp_diastolic"],
    CKDStage.G2: ["egfr", "creatinine", "acr", "bp_systolic", "bp_diastolic"],
    CKDStage.G3A: [
        "egfr", "creatinine", "acr", "bp_systolic", "bp_diastolic",
        "phosphate", "calcium", "hemoglobin", "potassium",
    ],
    CKDStage.G3B: [
        "egfr", "creatinine", "acr", "bp_systolic", "bp_diastolic",
        "phosphate", "calcium", "hemoglobin", "potassium",
    ],
    CKDStage.G4: [
        "egfr", "creatinine", "acr", "bp_systolic", "bp_diastolic",
        "phosphate", "calcium", "hemoglobin", "potassium",
        "pth", "bicarbonate",
    ],
    CKDStage.G5: [
        "egfr", "creatinine", "acr", "bp_systolic", "bp_diastolic",
        "phosphate", "calcium", "hemoglobin", "potassium",
        "pth", "bicarbonate", "urea", "albumin",
    ],
}


def get_stage_parameter_definitions(stage: CKDStage) -> list[dict]:
    """Return [{key, value_type}, ...] for the given stage, in order."""
    return [
        {"key": key, "value_type": PARAMETER_VALUE_TYPES[key]}
        for key in STAGE_PARAMETERS[stage]
    ]