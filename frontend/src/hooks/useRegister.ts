import { useState } from "react";
import type { RegisterRequest } from "../api/types/user";
import userApi from "../api/userApi";
import { useNavigate } from "react-router";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";

const useRegister = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const register = async (data: RegisterRequest) => {
    setLoading(true);
    setError(null);
    try {
      await userApi.register(data);
      navigate("/login");
    } catch (err) {
       setError(getApiErrorMessage(err, "Register failed. Please try again!"));
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, register };
};

export default useRegister;