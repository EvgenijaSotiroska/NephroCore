import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";
import appointmentApi from "../api/appointmentApi";
import { useSnackbar } from "./useSnackbar";
import type {
  AppointmentResponse,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
} from "../api/types/appointment";

interface UseAppointmentsResult {
  appointments: AppointmentResponse[];
  loading: boolean;
  error: string | null;

  createAppointment: (
    payload: CreateAppointmentRequest
  ) => Promise<AppointmentResponse | null>;

  updateAppointment: (
    appointmentId: string,
    payload: UpdateAppointmentRequest
  ) => Promise<AppointmentResponse | null>;

  deleteAppointment: (
    appointmentId: string
  ) => Promise<boolean>;

  creating: boolean;
  updating: boolean;
  deleting: boolean;

  refresh: (date?: string) => Promise<void>;
}

export function useAppointments(
  selectedDate?: string
): UseAppointmentsResult {
  const { showSnackbar } = useSnackbar();

  const [appointments, setAppointments] = useState<AppointmentResponse[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const refresh = useCallback(async (date?: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await appointmentApi.list(date);
      setAppointments(data);
    } catch (err) {
      setError(
        getApiErrorMessage(err, "Could not load appointments")
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh(selectedDate);
  }, [refresh, selectedDate]);

  const createAppointment = useCallback(
    async (
      payload: CreateAppointmentRequest
    ): Promise<AppointmentResponse | null> => {
      setCreating(true);

      try {
        const { data } = await appointmentApi.create(payload);

        showSnackbar(
          "Терминот е успешно закажан.",
          "success"
        );

        await refresh(selectedDate);

        return data;
      } catch (err) {
        const message = getApiErrorMessage(
          err,
          "Could not create appointment"
        );

        showSnackbar(message, "error");

        return null;
      } finally {
        setCreating(false);
      }
    },
    [refresh, selectedDate, showSnackbar]
  );

  const updateAppointment = useCallback(
    async (
      appointmentId: string,
      payload: UpdateAppointmentRequest
    ): Promise<AppointmentResponse | null> => {
      setUpdating(true);

      try {
        const { data } = await appointmentApi.update(
          appointmentId,
          payload
        );

        showSnackbar(
          "Терминот е успешно ажуриран.",
          "success"
        );

        await refresh(selectedDate);

        return data;
      } catch (err) {
        const message = getApiErrorMessage(
          err,
          "Could not update appointment"
        );

        showSnackbar(message, "error");

        return null;
      } finally {
        setUpdating(false);
      }
    },
    [refresh, selectedDate, showSnackbar]
  );

  const deleteAppointment = useCallback(
    async (appointmentId: string): Promise<boolean> => {
      setDeleting(true);

      try {
        await appointmentApi.remove(appointmentId);

        showSnackbar(
          "Терминот е избришан.",
          "success"
        );

        await refresh(selectedDate);

        return true;
      } catch (err) {
        const message = getApiErrorMessage(
          err,
          "Could not delete appointment"
        );

        showSnackbar(message, "error");

        return false;
      } finally {
        setDeleting(false);
      }
    },
    [refresh, selectedDate, showSnackbar]
  );

  return {
    appointments,
    loading,
    error,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    creating,
    updating,
    deleting,
    refresh,
  };
}