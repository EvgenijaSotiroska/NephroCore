import { useCallback, useEffect, useState } from "react";
import trendsApi from "../api/trendsApi";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";
import type { ParameterTrend, PatientTrendsResponse } from "../api/types/trends";

interface UseTrendsResult {
  data: PatientTrendsResponse | null;
  groupedParameters: Record<string, ParameterTrend[]>;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTrends(patientId: string | undefined): UseTrendsResult {
  const [data, setData] = useState<PatientTrendsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!patientId) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data: result } = await trendsApi.getPatientTrends(patientId);
      setData(result);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load patient trends"));
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    load();
  }, [load]);

  const groupedParameters: Record<string, ParameterTrend[]> = (data?.parameters ?? []).reduce(
    (groups, param) => {
      if (!groups[param.category]) groups[param.category] = [];
      groups[param.category].push(param);
      return groups;
    },
    {} as Record<string, ParameterTrend[]>
  );

  return { data, groupedParameters, isLoading, error, refetch: load };
}