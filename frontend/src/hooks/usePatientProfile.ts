import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";
import patientApi from "../api/patientApi";
import type { PatientProfile } from "../api/types/patient";

interface UsePatientProfileResult {
  profile: PatientProfile | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Fetches a patient's profile. Pass a `patientId` (doctor viewing a specific
 * patient) or omit it to fetch the logged-in patient's own profile.
 * Deliberately read-only — there is no update action here, since only the
 * owning doctor can edit clinical data.
 */
export function usePatientProfile(patientId?: string): UsePatientProfileResult {
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
      setError(getApiErrorMessage(err, "Could not load patient profile"));
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { profile, loading, error, refresh };
}