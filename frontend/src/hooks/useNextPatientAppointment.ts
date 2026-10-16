import { useEffect, useState } from "react";
import appointmentApi from "../api/appointmentApi";
import type { AppointmentResponse } from "../api/types/appointment";

export function useNextPatientAppointment(patientId?: string) {
  const [appointment, setAppointment] = useState<AppointmentResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) return;
    let cancelled = false;
    setLoading(true);

    appointmentApi
      .list(undefined, patientId)
      .then(({ data }) => {
        if (cancelled) return;
        const now = Date.now();
        const upcoming = data
          .filter(
            (a) =>
              a.status === "scheduled" &&
              new Date(a.scheduled_at).getTime() >= now
          )
          .sort(
            (a, b) =>
              new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
          );
        setAppointment(upcoming[0] ?? null);
      })
      .catch(() => {
        if (!cancelled) setAppointment(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [patientId]);

  return { appointment, loading };
}