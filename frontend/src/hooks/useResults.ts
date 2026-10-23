import { useCallback, useState } from "react";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";
import resultsApi from "../api/resultApi.ts";
import { useSnackbar } from "./useSnackbar";
import type { CreateVisitRequest, UpdateVisitRequest, VisitResponse } from "../api/types/result";

interface UseResultsResult {
  createResult: (payload: CreateVisitRequest) => Promise<VisitResponse | null>;
  updateResult: (visitId: string, payload: UpdateVisitRequest) => Promise<boolean>;
  deleteResult: (visitId: string) => Promise<boolean>;
  creating: boolean;
  error: string | null;
}

export function useResults(): UseResultsResult {
  const { showSnackbar } = useSnackbar();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createResult = useCallback(
    async (payload: CreateVisitRequest): Promise<VisitResponse | null> => {
      setCreating(true);
      setError(null);
      try {
        const { data } = await resultsApi.create(payload);
        showSnackbar("Резултатите се зачувани успешно.", "success");
        return data;
      } catch (err) {
        const message = getApiErrorMessage(err, "Не успеаја да се зачуваат резултатите");
        setError(message);
        showSnackbar(message, "error");
        return null;
      } finally {
        setCreating(false);
      }
    },
    [showSnackbar]
  );

  const updateResult = useCallback(
    async (visitId: string, payload: UpdateVisitRequest): Promise<boolean> => {
      try {
        await resultsApi.update(visitId, payload);
        showSnackbar("Резултатите се изменети.", "success");
        return true;
      } catch (err) {
        showSnackbar(getApiErrorMessage(err, "Не успеаја да се изменат резултатите"), "error");
        return false;
      }
    },
    [showSnackbar]
  );

  const deleteResult = useCallback(
    async (visitId: string): Promise<boolean> => {
      try {
        await resultsApi.remove(visitId);
        showSnackbar("Резултатите се избришани.", "success");
        return true;
      } catch (err) {
        showSnackbar(getApiErrorMessage(err, "Не успеаја да се избришат резултатите"), "error");
        return false;
      }
    },
    [showSnackbar]
  );

  return { createResult, updateResult, deleteResult, creating, error };
}