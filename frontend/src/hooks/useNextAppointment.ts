import { useEffect, useState } from "react";
import appointmentApi from "../api/appointmentApi";
import type { AppointmentResponse } from "../api/types/appointment";

export function useNextAppointment() {
  const [appointment, setAppointment] = useState<AppointmentResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    appointmentApi
      .next()
      .then(({ data }) => {
        if (!cancelled) setAppointment(data ?? null);
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
  }, []);

  return { appointment, loading };
}