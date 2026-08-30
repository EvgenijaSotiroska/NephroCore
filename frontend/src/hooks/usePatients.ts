import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";import patientApi from "../api/patientApi";
import useSnackbar from "./useSnackbar";
import type { CreatePatientRequest, CreatePatientResponse, PatientProfile } from "../api/types/patient";

interface UsePatientsResult {
  patients: PatientProfile[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createPatient: (payload: CreatePatientRequest) => Promise<CreatePatientResponse | null>;
  creating: boolean;
}

/**
 * For doctors: fetches the list of patients they created, and exposes a
 * createPatient() action that also refreshes the list on success.
 */
export function usePatients(): UsePatientsResult {
  const { showSnackbar } = useSnackbar();
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await patientApi.list();
      setPatients(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load patients"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createPatient = useCallback(
    async (payload: CreatePatientRequest): Promise<CreatePatientResponse | null> => {
      setCreating(true);
      try {
        const { data } = await patientApi.create(payload);
        await refresh();
        return data;
      } catch (err) {
        showSnackbar(getApiErrorMessage(err, "Could not create patient"), "error");
        return null;
      } finally {
        setCreating(false);
      }
    },
    [refresh, showSnackbar]
  );

  return { patients, loading, error, refresh, createPatient, creating };
}