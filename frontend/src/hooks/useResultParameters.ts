import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";
import resultsApi from "../api/resultApi.ts";
import type { CKDStage } from "../api/types/ckdStage.ts";
import type { ParameterDefinition } from "../api/types/result.ts";
import {
    STAGE_EGFR_RANGE_LABEL, STAGE_SHORT_LABELS
} from "../constants";

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
  allParameters: ParameterDefinition[];
}

export function useResultParameters(): UseResultParametersResult {
    const [stageParameters, setStageParameters] = useState<StageParameters[]>([]);
    const [allParameters, setAllParameters] = useState<ParameterDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [stagesRes, allRes] = await Promise.all([
                resultsApi.getParameters(),
                resultsApi.getAllParameters(),
            ]);
            setStageParameters(
                stagesRes.data.map((entry) => ({
                    stage: entry.stage,
                    label_mk: STAGE_SHORT_LABELS[entry.stage],
                    egfr_range_label: STAGE_EGFR_RANGE_LABEL[entry.stage],
                    parameters: entry.parameters,
                }))
            );
            setAllParameters(allRes.data);
        } catch (err) {
            setError(getApiErrorMessage(err, "Не може да се вчитаат параметрите"));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const getParametersForStage = (stage: CKDStage) =>
        stageParameters.find((entry) => entry.stage === stage);

    return {stageParameters, allParameters, getParametersForStage, loading, error};
}