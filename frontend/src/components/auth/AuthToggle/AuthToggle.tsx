import { Avatar, Box, Button, IconButton, Menu, MenuItem } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import { useState, type MouseEvent } from "react";
import { useNavigate } from "react-router";
import useAuth from "../../../hooks/useAuth";
import { AUTH_GRADIENT } from "../authStyles";

interface AuthToggleProps {
  onLogin: () => void;
  onRegister: () => void;
}

const AuthToggle = ({ onLogin, onRegister }: AuthToggleProps) => {
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleAvatarClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleLogout = () => {
    setAnchorEl(null);
    logout();
    navigate("/", { replace: true });
  };

  if (isLoggedIn) {
    return (
      <Box>
        <IconButton onClick={handleAvatarClick} size="small">
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: "grey.200",
              color: "grey.700",
            }}
          >
            <PersonIcon fontSize="small" />
          </Avatar>
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={!!anchorEl}
          onClose={() => setAnchorEl(null)}
        >
          <MenuItem onClick={handleLogout}>Одјава</MenuItem>
        </Menu>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      <Button
        onClick={onLogin}
        sx={{
          color: "text.primary",
          textTransform: "none",
          fontWeight: 600,
        }}
      >
        Најава
      </Button>

      <Button
        onClick={onRegister}
        sx={{
          background: AUTH_GRADIENT,
          color: "white",
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 2,
          px: 3,
          "&:hover": {
            background: AUTH_GRADIENT,
            opacity: 0.9,
          },
        }}
      >
        Регистрација
      </Button>
    </Box>
  );
};

export default AuthToggle;

