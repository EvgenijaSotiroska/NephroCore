import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";
import bloodPressureApi from "../api/bloodPressureApi";
import { useSnackbar } from "./useSnackbar";
import type { BloodPressureResponse, CreateBloodPressureRequest } from "../api/types/bloodPressure";

interface UseBloodPressureResult {
  readings: BloodPressureResponse[]; // newest first
  loading: boolean;
  error: string | null;
  adding: boolean;
  addReading: (payload: CreateBloodPressureRequest) => Promise<boolean>;
  removeReading: (readingId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

// Patients: call with no argument. Doctors: pass the patient's id (the server then returns only
// the readings since the patient's latest visit).
export function useBloodPressure(patientId?: string): UseBloodPressureResult {
  const { showSnackbar } = useSnackbar();

  const [readings, setReadings] = useState<BloodPressureResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await bloodPressureApi.list(patientId);
      setReadings(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Не успеаа да се вчитаат мерењата на притисокот"));
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addReading = useCallback(
    async (payload: CreateBloodPressureRequest) => {
      setAdding(true);
      try {
        await bloodPressureApi.create(payload);
        showSnackbar("Мерењето е додадено.", "success");
        await refresh();
        return true;
      } catch (err) {
        showSnackbar(getApiErrorMessage(err, "Не успеа да се додаде мерењето"), "error");
        return false;
      } finally {
        setAdding(false);
      }
    },
    [refresh, showSnackbar]
  );

  const removeReading = useCallback(
    async (readingId: string) => {
      try {
        await bloodPressureApi.remove(readingId);
        showSnackbar("Мерењето е избришано.", "success");
        await refresh();
        return true;
      } catch (err) {
        showSnackbar(getApiErrorMessage(err, "Не успеа да се избрише мерењето"), "error");
        return false;
      }
    },
    [refresh, showSnackbar]
  );

  return { readings, loading, error, adding, addReading, removeReading, refresh };
}
