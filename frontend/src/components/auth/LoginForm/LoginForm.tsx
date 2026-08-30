import { Box, Button, TextField, Typography } from "@mui/material";
import { useState } from "react";
import * as React from "react";
import { Link, useNavigate } from "react-router";
import useLogin from "../../../hooks/useLogin";
import AuthCard from "../AuthCard/AuthCard";
import RoleToggle, { type AuthRole } from "../RoleToggle/RoleToggle";
import { AUTH_GRADIENT } from "../authStyles";

interface FormData {
  email: string;
  password: string;
}

const initialFormData: FormData = {
  email: "",
  password: "",
};

const LoginForm = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<AuthRole>("doctor");
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const { login, loading, error } = useLogin();

  // Login is identical for both roles server-side — the backend already
  // knows the account's role. This toggle is purely orientation for the
  // person filling out the form.
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    // Doctors log in with their email as their username (see RegisterForm);
    // patients type the username they chose during activation.
    await login({ username: formData.email, password: formData.password });
  };

  return (
    <AuthCard
      title="Добредојдовте"
      subtitle="Најавете се во вашата NephroCore сметка"
      onClose={() => navigate("/")}
    >
      <RoleToggle value={role} onChange={setRole} />

      <Box component="form" onSubmit={handleSubmit}>
        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
          {role === "doctor" ? "Е-пошта" : "Корисничко име"}
        </Typography>
        <TextField
          fullWidth
          name="email"
          placeholder={role === "doctor" ? "vashata@email.com" : "korisnichko_ime"}
          value={formData.email}
          onChange={handleChange}
          required
          sx={{ mb: 2 }}
        />

        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
          Лозинка
        </Typography>
        <TextField
          fullWidth
          type="password"
          name="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          required
          sx={{ mb: 3 }}
        />

        {error && (
          <Typography variant="body2" color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <Button
          fullWidth
          type="submit"
          disabled={loading}
          sx={{
            background: AUTH_GRADIENT,
            color: "white",
            fontWeight: 600,
            py: 1.25,
            borderRadius: 2,
            textTransform: "none",
            "&:hover": { background: AUTH_GRADIENT, opacity: 0.9 },
          }}
        >
          {loading ? "Најавување…" : "Најава"}
        </Button>

        <Typography variant="body2" align="center" color="text.secondary" sx={{ mt: 3 }}>
          Немате сметка? <Link to="/register">Регистрирајте се</Link>
        </Typography>
      </Box>
    </AuthCard>
  );
};

export default LoginForm;