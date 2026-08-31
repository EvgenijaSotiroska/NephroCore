import { useState } from "react";
import type { LoginRequest } from "../api/types/user";
import userApi from "../api/userApi";
import { useNavigate } from "react-router";
import useAuth from "./useAuth";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";

const useLogin = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (data: LoginRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await userApi.login(data);
      authLogin(response.data.access_token);
      navigate(response.data.role === "doctor" ? "/doctor" : "/patient");
    } catch (err) {
      // No navigation, no toast — the caller renders `error` inline on the form.
      setError(getApiErrorMessage(err, "Login failed. Please try again!"));
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, login };
};

export default useLogin;