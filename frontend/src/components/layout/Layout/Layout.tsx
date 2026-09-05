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

  const openLogin = () => {
    setAuthDialog("login");
  };

  const openRegister = () => {
    setAuthDialog("register");
  };

  const openActivate = () => {
    setAuthDialog("activate");
  };

  return (
    <Box className="layout-box">
      <Header
        onLogin={openLogin}
        onRegister={openRegister}
      />

      <Box className="outlet-box">
        <Outlet
          context={{
            openLogin,
            openRegister,
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
            onSwitchToRegister={openRegister}
            onLoginSuccess={handleCloseAuth}
          />
        )}

        {authDialog === "register" && (
          <RegisterForm
            onClose={handleCloseAuth}
            onSwitchToLogin={openLogin}
            onSwitchToActivate={openActivate}
            onRegisterSuccess={handleCloseAuth}
          />
        )}

        {authDialog === "activate" && (
          <ActivateForm
            onClose={handleCloseAuth}
            onActivationSuccess={handleCloseAuth}
          />
        )}
      </Dialog>
    </Box>
  );
};

export default Layout;