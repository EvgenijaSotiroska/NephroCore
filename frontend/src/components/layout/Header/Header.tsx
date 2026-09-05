import "./Header.css";
import {
  AppBar,
  Box,
  Button,
  Dialog,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import { Link } from "react-router";
import { useState } from "react";

import AuthToggle from "../../auth/AuthToggle/AuthToggle";
import LoginForm from "../../auth/LoginForm/LoginForm";
import RegisterForm from "../../auth/RegisterForm/RegisterForm";
import ActivateForm from "../../auth/ActivateForm/ActivateForm";

import { AUTH_GRADIENT, AUTH_SERIF_FONT } from "../../auth/authStyles";

const pages = [
  { path: "/", name: "Почетна" },
  { path: "/#features", name: "Функции" },
  { path: "/#doctors", name: "За доктори" },
  { path: "/#patients", name: "За пациенти" },
  { path: "/#contact", name: "Контакт" },
];

const Header = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

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
    <Box>
      {/* ================= HEADER ================= */}
      <AppBar
        position="static"
        elevation={0}
        className="header-appbar"
      >
        <Toolbar sx={{ display: "flex", py: 1 }}>
          {/* Mobile menu */}
          <IconButton
            size="large"
            edge="start"
            aria-label="menu"
            sx={{
              mr: 2,
              display: { xs: "flex", md: "none" },
              color: "text.primary",
            }}
            onClick={() => setDrawerOpen(true)}
          >
            <MenuIcon />
          </IconButton>

          {/* Logo */}
          <Box
            component={Link}
            to="/"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              textDecoration: "none",
              mr: 4,
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "12px",
                background: AUTH_GRADIENT,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <LocalHospitalIcon
                sx={{
                  color: "white",
                  fontSize: 22,
                }}
              />
            </Box>

            <Box>
              <Typography
                sx={{
                  fontFamily: AUTH_SERIF_FONT,
                  fontWeight: 700,
                  fontSize: "1.25rem",
                  color: "text.primary",
                  lineHeight: 1.1,
                }}
              >
                NephroCore
              </Typography>

              <Typography
                sx={{
                  fontSize: "0.65rem",
                  letterSpacing: 1,
                  color: "text.secondary",
                  fontWeight: 600,
                }}
              >
                НЕФРОЛОГИЈА
              </Typography>
            </Box>
          </Box>

          {/* Desktop navigation */}
          <Box
            sx={{
              flexGrow: 1,
              display: { xs: "none", md: "flex" },
              gap: 0.5,
            }}
          >
            {pages.map((page) => (
              <Button
                key={page.name}
                component={Link}
                to={page.path}
                sx={{
                  color: "text.primary",
                  textTransform: "none",
                  fontWeight: 500,
                }}
              >
                {page.name}
              </Button>
            ))}
          </Box>

          {/* Desktop login/register */}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              justifyContent: "flex-end",
              ml: "auto",
            }}
          >
            <AuthToggle
              onLogin={openLogin}
              onRegister={openRegister}
            />
          </Box>
        </Toolbar>
      </AppBar>

      {/* ================= MOBILE DRAWER ================= */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box
          sx={{
            width: 260,
            height: "100%",
          }}
          role="presentation"
        >
          <List>
            {pages.map((page) => (
              <ListItem key={page.name} disablePadding>
                <ListItemButton
                  component={Link}
                  to={page.path}
                  onClick={() => setDrawerOpen(false)}
                >
                  <ListItemText primary={page.name} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* ================= AUTH POPUP ================= */}
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
            margin: { xs: 1.5, sm: 3 },
          },
        }}
      >
        {/* LOGIN */}
        {authDialog === "login" && (
          <LoginForm
            onClose={handleCloseAuth}
            onSwitchToRegister={openRegister}
            onLoginSuccess={handleCloseAuth}
          />
        )}

        {/* REGISTER */}
        {authDialog === "register" && (
          <RegisterForm
            onClose={handleCloseAuth}
            onSwitchToLogin={openLogin}
            onSwitchToActivate={openActivate}
            onRegisterSuccess={handleCloseAuth}
          />
        )}

        {/* ACTIVATE */}
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

export default Header;