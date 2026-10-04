import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";
import symptomApi from "../api/symptomApi";
import { useSnackbar } from "./useSnackbar";
import type {
  CreateSymptomRequest,
  SymptomResponse,
  UpdateSymptomRequest,
} from "../api/types/symptom";

interface UseSymptomsResult {
  symptoms: SymptomResponse[];
  loading: boolean;
  error: string | null;
  adding: boolean;
  addSymptom: (payload: CreateSymptomRequest) => Promise<boolean>;
  updateSymptom: (symptomId: string, payload: UpdateSymptomRequest) => Promise<boolean>;
  removeSymptom: (symptomId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

// Patients: call with no argument. Doctors: pass the patient's id.
export function useSymptoms(patientId?: string): UseSymptomsResult {
  const { showSnackbar } = useSnackbar();

  const [symptoms, setSymptoms] = useState<SymptomResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await symptomApi.list(patientId);
      setSymptoms(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Не успеаа да се вчитаат симптомите"));
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addSymptom = useCallback(
    async (payload: CreateSymptomRequest) => {
      setAdding(true);
      try {
        await symptomApi.create({ ...payload, patient_id: payload.patient_id ?? patientId });
        showSnackbar("Симптомот е додаден.", "success");
        await refresh();
        return true;
      } catch (err) {
        showSnackbar(getApiErrorMessage(err, "Не успеа да се додаде симптомот"), "error");
        return false;
      } finally {
        setAdding(false);
      }
    },
    [patientId, refresh, showSnackbar]
  );

  const updateSymptom = useCallback(
    async (symptomId: string, payload: UpdateSymptomRequest) => {
      try {
        await symptomApi.update(symptomId, payload);
        showSnackbar("Симптомот е ажуриран.", "success");
        await refresh();
        return true;
      } catch (err) {
        showSnackbar(getApiErrorMessage(err, "Не успеа да се ажурира симптомот"), "error");
        return false;
      }
    },
    [refresh, showSnackbar]
  );

  const removeSymptom = useCallback(
    async (symptomId: string) => {
      try {
        await symptomApi.remove(symptomId);
        showSnackbar("Симптомот е избришан.", "success");
        await refresh();
        return true;
      } catch (err) {
        showSnackbar(getApiErrorMessage(err, "Не успеа да се избрише симптомот"), "error");
        return false;
      }
    },
    [refresh, showSnackbar]
  );

  return { symptoms, loading, error, adding, addSymptom, updateSymptom, removeSymptom, refresh };
}