import { useCallback, useState } from "react";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";
import aiApi from "../api/aiApi";

interface UseExplainResultsResult {
  explanation: string | null;
  loading: boolean;
  error: string | null;
  generate: () => Promise<void>;
}

export function useExplainResults(patientId: string | undefined): UseExplainResultsResult {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await aiApi.explainResults(patientId);
      setExplanation(data.analysis);
    } catch (err) {
      setError(getApiErrorMessage(err, "Неуспешно објаснување на резултатите"));
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  return { explanation, loading, error, generate };
}