import axiosInstance from "../axios/axios";
import type {
  ActivateRequest,
  ActivateResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from "./types/user";

const userApi = {
  register: async (data: RegisterRequest) => {
    return await axiosInstance.post<RegisterResponse>("/auth/register/doctor", data);
  },
  login: async (data: LoginRequest) => {
    return await axiosInstance.post<LoginResponse>("/auth/login", data);
  },
  activate: async (data: ActivateRequest) => {
    return await axiosInstance.post<ActivateResponse>("/auth/activate", data);
  },
};

export default userApi;