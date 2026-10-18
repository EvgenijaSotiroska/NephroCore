import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";
import patientApi from "../api/patientApi";
import { useSnackbar } from "./useSnackbar";
import type {
  CreatePatientRequest,
  CreatePatientResponse,
  PatientProfile,
  UpdatePatientRequest,
} from "../api/types/patient";

interface UsePatientsResult {
  patients: PatientProfile[];
  loading: boolean;
  error: string | null;
  createPatient: (payload: CreatePatientRequest) => Promise<CreatePatientResponse | null>;
  creating: boolean;
  updatePatient: (patientId: string, payload: UpdatePatientRequest) => Promise<boolean>;
  updating: boolean;
}

export function usePatients(): UsePatientsResult {
  const { showSnackbar } = useSnackbar();
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await patientApi.list();
      setPatients(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Не може да се вчитаат пациентите"));
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
        showSnackbar(getApiErrorMessage(err, "Не успеа да се креира пациентот"), "error");
        return null;
      } finally {
        setCreating(false);
      }
    },
    [refresh, showSnackbar]
  );

  const updatePatient = useCallback(
    async (patientId: string, payload: UpdatePatientRequest): Promise<boolean> => {
      setUpdating(true);
      try {
        await patientApi.update(patientId, payload);
        showSnackbar("Профилот на пациентот е зачуван.", "success");
        await refresh();
        return true;
      } catch (err) {
        showSnackbar(getApiErrorMessage(err, "Не успеа да се зачуваат промените"), "error");
        return false;
      } finally {
        setUpdating(false);
      }
    },
    [refresh, showSnackbar]
  );

  return { patients, loading, error, createPatient, creating, updatePatient, updating };
}