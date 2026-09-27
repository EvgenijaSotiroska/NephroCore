import { useContext } from "react";
import SnackbarContext, { type SnackbarContextType } from "../context/SnackbarContext";

export function useSnackbar(): SnackbarContextType {
  return useContext<SnackbarContextType>(SnackbarContext);
}