import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";
import resultsApi from "../api/resultApi";
import type { VisitResponse } from "../api/types/result";

interface UseVisitsResult {
  visits: VisitResponse[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useVisits(patientId: string | undefined): UseVisitsResult {
  const [visits, setVisits] = useState<VisitResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await resultsApi.listForPatient(patientId);
      setVisits(data.visits);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load visit history"));
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { visits, loading, error, refresh };
}