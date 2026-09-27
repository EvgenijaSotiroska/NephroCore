import { useCallback, useState } from "react";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";
import aiApi from "../api/aiApi";

interface UseAiAnalysisResult {
  analysis: string | null;
  loading: boolean;
  error: string | null;
  generate: () => Promise<void>;
}

export function useAiAnalysis(patientId: string | undefined): UseAiAnalysisResult {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await aiApi.generateAnalysis(patientId);
      setAnalysis(data.analysis);
    } catch (err) {
      setError(getApiErrorMessage(err, "Неуспешна AI анализа"));
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  return { analysis, loading, error, generate };
}