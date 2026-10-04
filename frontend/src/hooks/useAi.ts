import { useCallback, useState } from "react";
import type { AxiosResponse } from "axios";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";
import aiApi from "../api/aiApi";
import type { AIAnalysisResponse } from "../api/types/ai";

interface UseAiTextResult {
  text: string | null;
  loading: boolean;
  error: string | null;
  generate: () => Promise<void>;
}

function useAiText(
  patientId: string | undefined,
  request: (patientId: string) => Promise<AxiosResponse<AIAnalysisResponse>>,
  errorMessage: string
): UseAiTextResult {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await request(patientId);
      setText(data.analysis);
    } catch (err) {
      setError(getApiErrorMessage(err, errorMessage));
    } finally {
      setLoading(false);
    }
  }, [patientId, request, errorMessage]);

  return { text, loading, error, generate };
}

// Doctor-facing clinical analysis
export function useAiAnalysis(patientId: string | undefined) {
  const { text, ...rest } = useAiText(patientId, aiApi.generateAnalysis, "Неуспешна AI анализа");
  return { analysis: text, ...rest };
}

// Patient-facing plain-language explanation
export function useExplainResults(patientId: string | undefined) {
  const { text, ...rest } = useAiText(patientId, aiApi.explainResults, "Неуспешно објаснување на резултатите");
  return { explanation: text, ...rest };
}