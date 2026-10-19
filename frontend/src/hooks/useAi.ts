import { useCallback, useState } from "react";
import type { AxiosResponse } from "axios";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";
import aiApi from "../api/aiApi";
import type { AIAnalysis } from "../api/types/ai";

interface UseAiTextResult {
  history: AIAnalysis[]; // newest first
  loading: boolean; // generating a new one
  historyLoading: boolean;
  error: string | null;
  generate: () => Promise<void>;
  loadHistory: () => Promise<void>;
}

function useAiText(
  patientId: string | undefined,
  generateRequest: (patientId: string) => Promise<AxiosResponse<AIAnalysis>>,
  listRequest: (patientId: string) => Promise<AxiosResponse<AIAnalysis[]>>,
  errorMessage: string
): UseAiTextResult {
  const [history, setHistory] = useState<AIAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!patientId) return;
    setHistoryLoading(true);
    try {
      const { data } = await listRequest(patientId);
      setHistory(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Не може да се вчита претходните анализи"));
    } finally {
      setHistoryLoading(false);
    }
  }, [patientId, listRequest]);

  const generate = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await generateRequest(patientId);
      setHistory((prev) => [data, ...prev]);
    } catch (err) {
      setError(getApiErrorMessage(err, errorMessage));
    } finally {
      setLoading(false);
    }
  }, [patientId, generateRequest, errorMessage]);

  return { history, loading, historyLoading, error, generate, loadHistory };
}

export function useAiAnalysis(patientId: string | undefined) {
  return useAiText(patientId, aiApi.generateAnalysis, aiApi.listAnalyses, "Неуспешна AI анализа");
}

export function useExplainResults(patientId: string | undefined) {
  return useAiText(
    patientId,
    aiApi.explainResults,
    aiApi.listExplanations,
    "Неуспешно објаснување на резултатите"
  );
}