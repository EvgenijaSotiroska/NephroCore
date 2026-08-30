import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";import patientApi from "../api/patientApi";
import type { PatientProfile } from "../api/types/patient";

interface UsePatientProfileResult {
  profile: PatientProfile | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * For patients: fetches their own profile. Deliberately read-only — there is
 * no update action here, since only the owning doctor can edit clinical data.
 */
export function usePatientProfile(): UsePatientProfileResult {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await patientApi.getMine();
      setProfile(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load your profile"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { profile, loading, error, refresh };
}