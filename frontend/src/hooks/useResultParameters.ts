import {useCallback, useEffect, useState} from "react";
import {getApiErrorMessage} from "../utils/getApiErrorMessage";
import resultsApi from "../api/resultApi.ts";
import type {CKDStage} from "../api/types/cdkStage.ts";

const STAGE_LABELS_MK: Record<CKDStage, string> = {
  G1: "Нормална или висока функција",
  G2: "Благо намалена функција",
  G3A: "Благо до умерено намалена функција",
  G3B: "Умерено до тешко намалена функција",
  G4: "Тешко намалена функција",
  G5: "Бубрежна инсуфициенција",
};

const STAGE_EGFR_RANGE_LABEL: Record<CKDStage, string> = {
  G1: "≥ 90",
  G2: "60–89",
  G3A: "45–59",
  G3B: "30–44",
  G4: "15–29",
  G5: "< 15",
};
export type {CKDStage};

export interface ParameterDefinition {
    key: string;
    value_type: "float" | "int";
    label_mk: string;
    unit: string;
    reference_mk: string;
}

export interface StageParameters {
    stage: CKDStage;
    label_mk: string;
    egfr_range_label: string;
    parameters: ParameterDefinition[];
}

interface UseResultParametersResult {
    stageParameters: StageParameters[];
    getParametersForStage: (stage: CKDStage) => StageParameters | undefined;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export function useResultParameters(): UseResultParametersResult {
    const [stageParameters, setStageParameters] = useState<StageParameters[]>(
        []
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const {data} = await resultsApi.getParameters();
            setStageParameters(
                data.map((entry) => ({
                    stage: entry.stage,
                    label_mk: STAGE_LABELS_MK[entry.stage],
                    egfr_range_label: STAGE_EGFR_RANGE_LABEL[entry.stage],
                    parameters: entry.parameters.map((param) => ({
                        key: param.key,
                        value_type: param.value_type,
                        label_mk: param.label_mk,
                        unit: param.unit,
                        reference_mk: param.reference_mk,
                    })),
                }))
            );
        } catch (err) {
            setError(getApiErrorMessage(err, "Could not load parameters"));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const getParametersForStage = (stage: CKDStage) =>
        stageParameters.find((entry) => entry.stage === stage);

    return {stageParameters, getParametersForStage, loading, error, refresh};
}