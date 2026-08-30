import axios from "axios";

interface ApiErrorBody {
  detail?: string;
}

/** Pulls a FastAPI HTTPException's `detail` out of an error, with a fallback. */
export function getApiErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError<ApiErrorBody>(err)) {
    return err.response?.data?.detail ?? fallback;
  }
  return fallback;
}