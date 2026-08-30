import { useCallback, useMemo, useState } from "react";
import * as React from "react";
import SnackbarContext, { type SnackbarSeverity } from "../context/SnackbarContext";

interface SnackbarState {
  message: string;
  severity: SnackbarSeverity;
}

const AUTO_HIDE_MS = 5000;

const SEVERITY_COLORS: Record<SnackbarSeverity, string> = {
  success: "#2e7d32",
  error: "#c62828",
  info: "#1565c0",
  warning: "#ef6c00",
};

const SnackbarProvider = ({ children }: { children: React.ReactNode }) => {
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);

  const showSnackbar = useCallback((message: string, severity: SnackbarSeverity = "info") => {
    setSnackbar({ message, severity });
    window.setTimeout(() => setSnackbar(null), AUTO_HIDE_MS);
  }, []);

  const value = useMemo(() => ({ showSnackbar }), [showSnackbar]);

  return (
    <SnackbarContext value={value}>
      {children}
      {snackbar && (
        <div
          role="alert"
          style={{
            position: "fixed",
            bottom: "1.5rem",
            left: "50%",
            transform: "translateX(-50%)",
            background: SEVERITY_COLORS[snackbar.severity],
            color: "white",
            padding: "0.75rem 1.25rem",
            borderRadius: "6px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          {snackbar.message}
        </div>
      )}
    </SnackbarContext>
  );
};

export default SnackbarProvider;