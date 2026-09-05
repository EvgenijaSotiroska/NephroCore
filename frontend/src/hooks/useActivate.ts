import { useState } from "react";
import type { ActivateRequest } from "../api/types/user";
import userApi from "../api/userApi";
import { useNavigate } from "react-router";
import useAuth from "./useAuth";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";

const useActivate = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const activate = async (data: ActivateRequest): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await userApi.activate(data);

      authLogin(response.data.access_token);

      navigate("/patient");

      return true;
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Could not activate account. Please try again!"
        )
      );

      return false;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, activate };
};

export default useActivate;