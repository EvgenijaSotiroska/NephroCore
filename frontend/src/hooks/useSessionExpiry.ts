import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import type { UserPayload } from "../api/types/user";

const WARNING_WINDOW_MS = 15 * 60 * 1000; // warn in the last 15 minutes

interface UseSessionExpiryResult {
  /** True once fewer than WARNING_WINDOW_MS remain before the token expires. */
  expiringSoon: boolean;
  /** Minutes left, rounded down; null if no valid token is present. */
  minutesRemaining: number | null;
}

/**
 * Since there's no refresh token, a session just ends when the access token
 * expires (~6h). This polls the token's `exp` client-side so the UI can show
 * a "your session is about to expire, save your work" banner before that
 * happens, rather than the user finding out via a sudden 401.
 */
export function useSessionExpiry(): UseSessionExpiryResult {
  const [state, setState] = useState<UseSessionExpiryResult>({
    expiringSoon: false,
    minutesRemaining: null,
  });

  useEffect(() => {
    function check() {
      const token = localStorage.getItem("token");
      if (!token) {
        setState({ expiringSoon: false, minutesRemaining: null });
        return;
      }
      let decoded: UserPayload;
      try {
        decoded = jwtDecode<UserPayload>(token);
      } catch {
        setState({ expiringSoon: false, minutesRemaining: null });
        return;
      }
      const msRemaining = decoded.exp * 1000 - Date.now();
      setState({
        expiringSoon: msRemaining > 0 && msRemaining < WARNING_WINDOW_MS,
        minutesRemaining: Math.max(0, Math.floor(msRemaining / 60000)),
      });
    }

    check();
    const interval = setInterval(check, 60 * 1000); // recheck every minute
    return () => clearInterval(interval);
  }, []);

  return state;
}