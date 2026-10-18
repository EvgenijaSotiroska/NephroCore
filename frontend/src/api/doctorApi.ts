import axiosInstance from "../axios/axios";
import type { DoctorProfile } from "./types/doctor";

const doctorApi = {
  getMine: async () => {
    return await axiosInstance.get<DoctorProfile>("/doctors/me");
  },
};

export default doctorApi;