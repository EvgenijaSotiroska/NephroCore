import { useContext } from "react";
import SnackbarContext, { type SnackbarContextType } from "../context/SnackbarContext";

const useSnackbar = () => useContext<SnackbarContextType>(SnackbarContext);

export default useSnackbar;