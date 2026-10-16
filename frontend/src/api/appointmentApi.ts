import axiosInstance from "../axios/axios";
import type {
  AppointmentResponse,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
} from "./types/appointment";

const appointmentApi = {
  create: async (data: CreateAppointmentRequest) => {
    return await axiosInstance.post<AppointmentResponse>(
      "/appointments",
      data
    );
  },

   list: async (date?: string, patientId?: string) => {
    return await axiosInstance.get<AppointmentResponse[]>(
      "/appointments",
      {
        params: {
          ...(date ? { appointment_date: date } : {}),
          ...(patientId ? { patient_id: patientId } : {}),
        },
      }
    );
  },

  // patient: their next upcoming scheduled appointment (or null)
  next: async () => {
    return await axiosInstance.get<AppointmentResponse | null>(
      "/appointments/next"
    );
  },

  get: async (appointmentId: string) => {
    return await axiosInstance.get<AppointmentResponse>(
      `/appointments/${appointmentId}`
    );
  },

  update: async (
    appointmentId: string,
    data: UpdateAppointmentRequest
  ) => {
    return await axiosInstance.put<AppointmentResponse>(
      `/appointments/${appointmentId}`,
      data
    );
  },

  remove: async (appointmentId: string) => {
    return await axiosInstance.delete(
      `/appointments/${appointmentId}`
    );
  },
};

export default appointmentApi;