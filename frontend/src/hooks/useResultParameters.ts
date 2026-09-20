import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";
import resultsApi from "../api/resultApi.ts";
import type { CKDStage } from "../api/types/cdkStage.ts";
import {
  PARAMETER_LABELS,
  STAGE_LABELS_MK,
  STAGE_EGFR_RANGE_LABEL,
} from "../constants/resultParameterLabels";

export type { CKDStage };

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
      const { data } = await resultsApi.getParameters();
      setStageParameters(
        data.map((entry) => ({
          stage: entry.stage,
          label_mk: STAGE_LABELS_MK[entry.stage],
          egfr_range_label: STAGE_EGFR_RANGE_LABEL[entry.stage],
          parameters: entry.parameters.map((param) => {
            const label = PARAMETER_LABELS[param.key];
            return {
              key: param.key,
              value_type: param.value_type,
              label_mk: label?.label_mk ?? param.key,
              unit: label?.unit ?? "",
              reference_mk: label?.reference_mk ?? "",
            };
          }),
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

  return { stageParameters, getParametersForStage, loading, error, refresh };
}