import "./Layout.css";
import { Box, Dialog } from "@mui/material";
import { Outlet } from "react-router";
import { useState } from "react";

import Header from "../Header/Header";
import LoginForm from "../../auth/LoginForm/LoginForm";
import RegisterForm from "../../auth/RegisterForm/RegisterForm";
import ActivateForm from "../../auth/ActivateForm/ActivateForm";

export interface AuthContext {
  openLogin: () => void;
  openRegister: () => void;
}

const Layout = () => {
  const [authDialog, setAuthDialog] = useState<
    "login" | "register" | "activate" | null
  >(null);

  const handleCloseAuth = () => {
    setAuthDialog(null);
  };

  return (
    <Box className="layout-box">
      <Header
        onLogin={() => setAuthDialog("login")}
        onRegister={() => setAuthDialog("register")}
      />

      <Box className="outlet-box">
        <Outlet
          context={{
            openLogin: () => setAuthDialog("login"),
            openRegister: () => setAuthDialog("register"),
          }}
        />
      </Box>

      <Dialog
        open={authDialog !== null}
        onClose={handleCloseAuth}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            backgroundColor: "transparent",
            boxShadow: "none",
            overflow: "visible",
          },
        }}
      >
        {authDialog === "login" && (
          <LoginForm
            onClose={handleCloseAuth}
            onSwitchToRegister={() => setAuthDialog("register")}
          />
        )}

        {authDialog === "register" && (
          <RegisterForm
            onClose={handleCloseAuth}
            onSwitchToLogin={() => setAuthDialog("login")}
            onSwitchToActivate={() => setAuthDialog("activate")}
            onRegisterSuccess={() => setAuthDialog("login")}
          />
        )}

        {authDialog === "activate" && (
          <ActivateForm
            onClose={handleCloseAuth}
          />
        )}
      </Dialog>
    </Box>
  );
};

export default Layout;