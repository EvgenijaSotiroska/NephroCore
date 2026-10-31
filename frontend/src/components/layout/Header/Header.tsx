import "./Header.css";
import {
  AppBar,
  Box,
  Button,
  Divider,
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
import { Link, useLocation, useNavigate } from "react-router";
import { useState } from "react";

import AuthToggle from "../../auth/AuthToggle/AuthToggle";

import { AUTH_GRADIENT, AUTH_SERIF_FONT } from "../../auth/authStyles";
import { useAuth } from "../../../hooks/useAuth";

interface HeaderProps {
  onLogin: () => void;
  onRegister: () => void;
}

export default function Header({ onLogin, onRegister }: HeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { user, isLoggedIn, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const isDoctor = isLoggedIn && user?.role === "doctor";

  const pages = isDoctor
    ? [
        {
          path: "/",
          name: "Почетна",
        },
        {
          path: "/doctor",
          name: "Преглед",
        },
        {
          path: "/appointments",
          name: "Календар",
        },
      ]
    : [];

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + "/");

  const handleLogout = () => {
    setDrawerOpen(false);
    logout();
    navigate("/", { replace: true });
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
          {/* Mobile menu - everyone who is logged in (it holds the logout) */}
          {isLoggedIn && (
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
          )}

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
                ГРИЖА ЗА ВАШИТЕ БУБРЕЗИ
              </Typography>
            </Box>
          </Box>

          {/* Desktop navigation - doctors only */}
          {isDoctor && (
            <Box
              sx={{
                flexGrow: 1,
                display: { xs: "none", md: "flex" },
                gap: 0.5,
              }}
            >
              {pages.map((page) => {
                const active = isActive(page.path);
                return (
                  <Button
                    key={page.name}
                    component={Link}
                    to={page.path}
                    sx={{
                      color: active ? "#000" : "text.primary",
                      textTransform: "none",
                      fontWeight: 500,
                    }}
                  >
                    {page.name}
                  </Button>
                );
              })}
            </Box>
          )}

          {/* Login/Register */}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              justifyContent: "flex-end",
              ml: "auto",
            }}
          >
            <AuthToggle
              onLogin={onLogin}
              onRegister={onRegister}
            />
          </Box>
        </Toolbar>
      </AppBar>

      {/* ================= MOBILE DRAWER ================= */}
      {isLoggedIn && (
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
              {pages.map((page) => {
                const active = isActive(page.path);
                return (
                  <ListItem key={page.name} disablePadding>
                    <ListItemButton
                      component={Link}
                      to={page.path}
                      onClick={() => setDrawerOpen(false)}
                    >
                      <ListItemText
                        primary={page.name}
                        primaryTypographyProps={{
                          color: active ? "#000" : "text.primary",
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>

            {pages.length > 0 && <Divider />}

            <List>
              <ListItem disablePadding>
                <ListItemButton onClick={handleLogout}>
                  <ListItemText primary="Одјава" />
                </ListItemButton>
              </ListItem>
            </List>
          </Box>
        </Drawer>
      )}
    </Box>
  );
}