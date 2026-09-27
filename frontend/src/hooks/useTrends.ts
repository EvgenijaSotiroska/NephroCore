import { useCallback, useEffect, useState } from "react";
import { fetchPatientTrends } from "../api/trendsApi.ts";
import type { ParameterTrend, PatientTrendsResponse } from "../api/types/trends";

interface UseTrendsResult {
  data: PatientTrendsResponse | null;
  groupedParameters: Record<string, ParameterTrend[]>;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Loads a patient's trend dashboard data.
 * `refetch` is exposed so the dashboard can be refreshed after a new visit
 * is entered elsewhere in the app.
 */
export function useTrends(patientId: string | undefined): UseTrendsResult {
  const [data, setData] = useState<PatientTrendsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (!patientId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchPatientTrends(patientId);
      setData(result);
    } catch (err) {
      setError(err as Error);
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