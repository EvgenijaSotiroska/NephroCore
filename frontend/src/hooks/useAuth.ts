import { useContext } from "react";
import AuthContext, { type AuthContextType } from "../context/AuthContext.ts";

const useAuth = () => useContext<AuthContextType>(AuthContext);

export default useAuth;