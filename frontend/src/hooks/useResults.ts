import { useCallback, useState } from "react";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";
import resultsApi from "../api/resultApi.ts";
import useSnackbar from "./useSnackbar";
import type { CreateVisitRequest, VisitResponse } from "../api/types/result";

interface UseResultsResult {
  createResult: (payload: CreateVisitRequest) => Promise<VisitResponse | null>;
  creating: boolean;
}

export function useResults(): UseResultsResult {
  const { showSnackbar } = useSnackbar();
  const [creating, setCreating] = useState(false);

  const createResult = useCallback(
    async (payload: CreateVisitRequest): Promise<VisitResponse | null> => {
      setCreating(true);
      try {
        const { data } = await resultsApi.create(payload);
        showSnackbar("Резултатите се зачувани успешно.", "success");
        return data;
      } catch (err) {
        showSnackbar(getApiErrorMessage(err, "Could not save results"), "error");
        return null;
      } finally {
        setCreating(false);
      }
    },
    [showSnackbar]
  );

  return { createResult, creating };
}