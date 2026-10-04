import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";
import medicationApi from "../api/medicationApi";
import { useSnackbar } from "./useSnackbar";
import type {
  CreateMedicationRequest,
  MedicationResponse,
  UpdateMedicationRequest,
} from "../api/types/medication";

interface UseMedicationsResult {
  medications: MedicationResponse[];
  loading: boolean;
  error: string | null;
  saving: boolean;
  addMedication: (payload: CreateMedicationRequest) => Promise<boolean>;
  updateMedication: (medicationId: string, payload: UpdateMedicationRequest) => Promise<boolean>;
  removeMedication: (medicationId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useMedications(patientId?: string): UseMedicationsResult {
  const { showSnackbar } = useSnackbar();

  const [medications, setMedications] = useState<MedicationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await medicationApi.list(patientId);
      setMedications(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Не успеаа да се вчитаат лековите"));
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addMedication = useCallback(
    async (payload: CreateMedicationRequest) => {
      setSaving(true);
      try {
        await medicationApi.create({ ...payload, patient_id: payload.patient_id ?? patientId });
        showSnackbar("Лекот е додаден.", "success");
        await refresh();
        return true;
      } catch (err) {
        showSnackbar(getApiErrorMessage(err, "Не успеа да се додаде лекот"), "error");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [patientId, refresh, showSnackbar]
  );

  const updateMedication = useCallback(
    async (medicationId: string, payload: UpdateMedicationRequest) => {
      setSaving(true);
      try {
        await medicationApi.update(medicationId, payload);
        showSnackbar("Лекот е ажуриран.", "success");
        await refresh();
        return true;
      } catch (err) {
        showSnackbar(getApiErrorMessage(err, "Не успеа да се ажурира лекот"), "error");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [refresh, showSnackbar]
  );

  const removeMedication = useCallback(
    async (medicationId: string) => {
      try {
        await medicationApi.remove(medicationId);
        showSnackbar("Лекот е избришан.", "success");
        await refresh();
        return true;
      } catch (err) {
        showSnackbar(getApiErrorMessage(err, "Не успеа да се избрише лекот"), "error");
        return false;
      }
    },
    [refresh, showSnackbar]
  );

  return {
    medications,
    loading,
    error,
    saving,
    addMedication,
    updateMedication,
    removeMedication,
    refresh,
  };
}