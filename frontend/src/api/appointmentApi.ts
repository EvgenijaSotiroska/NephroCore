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

  list: async (date?: string) => {
    return await axiosInstance.get<AppointmentResponse[]>(
      "/appointments",
      {
        params: date ? { appointment_date: date } : undefined,
      }
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