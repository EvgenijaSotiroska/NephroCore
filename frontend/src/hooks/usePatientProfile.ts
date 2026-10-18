import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";
import patientApi from "../api/patientApi";
import { useSnackbar } from "./useSnackbar";
import type { PatientProfile } from "../api/types/patient";

interface UsePatientProfileResult {
  profile: PatientProfile | null;
  loading: boolean;
  error: string | null;
  // Doctor only: mark the patient active or inactive. Resolves to true when it worked.
  setActive: (isActive: boolean) => Promise<boolean>;
}

export function usePatientProfile(patientId?: string): UsePatientProfileResult {
  const { showSnackbar } = useSnackbar();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = patientId
        ? await patientApi.getById(patientId)
        : await patientApi.getMine();
      setProfile(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Не успеа да се вчита профилот на пациентот"));
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setActive = useCallback(
    async (isActive: boolean) => {
      if (!patientId) return false;
      try {
        const { data } = await patientApi.setStatus(patientId, isActive);
        setProfile(data);
        showSnackbar(
          isActive ? "Пациентот е означен како активен." : "Пациентот е означен како неактивен.",
          "success"
        );
        return true;
      } catch (err) {
        showSnackbar(getApiErrorMessage(err, "Не успеа промената на статусот"), "error");
        return false;
      }
    },
    [patientId, showSnackbar]
  );

  return { profile, loading, error, setActive };
}
