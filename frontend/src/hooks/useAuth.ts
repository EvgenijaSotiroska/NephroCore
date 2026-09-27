import { useContext } from "react";
import AuthContext, { type AuthContextType } from "../context/AuthContext.ts";

export function useAuth(): AuthContextType {
  return useContext<AuthContextType>(AuthContext);
}