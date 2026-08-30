import { Box, Button, TextField, Typography } from "@mui/material";
import { useState } from "react";
import * as React from "react";
import { Link, useNavigate } from "react-router";
import useRegister from "../../../hooks/useRegister";
import AuthCard from "../AuthCard/AuthCard";
import RoleToggle, { type AuthRole } from "../RoleToggle/RoleToggle";
import { AUTH_GRADIENT } from "../authStyles";

interface FormData {
  firstName: string;
  lastName: string;
  hospital: string;
  email: string;
  password: string;
}

const initialFormData: FormData = {
  firstName: "",
  lastName: "",
  hospital: "",
  email: "",
  password: "",
};

const RegisterForm = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<AuthRole>("doctor");
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const { register, error, loading } = useRegister();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    // The doctor's email doubles as their login username — one field on
    // screen, both values sent to the backend.
    await register({
      username: formData.email,
      email: formData.email,
      password: formData.password,
      first_name: formData.firstName,
      last_name: formData.lastName,
      hospital: formData.hospital || undefined,
    });
  };

  return (
    <AuthCard title="Создадете сметка" subtitle="Придружете се на NephroCore платформата">
      <RoleToggle value={role} onChange={setRole} />

      {role === "patient" ? (
        <Box sx={{ textAlign: "center", py: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Пациентите добиваат пристап преку код за покана од својот доктор. Ако веќе имате код,
            активирајте ја вашата сметка тука.
          </Typography>
          <Button
            fullWidth
            onClick={() => navigate("/activate")}
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
            Активирај сметка
          </Button>
        </Box>
      ) : (
        <Box component="form" onSubmit={handleSubmit}>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                Име
              </Typography>
              <TextField
                fullWidth
                name="firstName"
                placeholder="Марија"
                value={formData.firstName}
                onChange={handleChange}
                required
                sx={{ mb: 2 }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                Презиме
              </Typography>
              <TextField
                fullWidth
                name="lastName"
                placeholder="Петрова"
                value={formData.lastName}
                onChange={handleChange}
                required
                sx={{ mb: 2 }}
              />
            </Box>
          </Box>

          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
            Болница
          </Typography>
          <TextField
            fullWidth
            name="hospital"
            placeholder="Клинички центар Скопје"
            value={formData.hospital}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />

          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
            Е-пошта
          </Typography>
          <TextField
            fullWidth
            type="email"
            name="email"
            placeholder="vashata@email.com"
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
            inputProps={{ minLength: 8 }}
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
            {loading ? "Регистрација…" : "Регистрација"}
          </Button>

          <Typography variant="body2" align="center" color="text.secondary" sx={{ mt: 3 }}>
            Веќе имате сметка? <Link to="/login">Најавете се</Link>
          </Typography>
        </Box>
      )}
    </AuthCard>
  );
};

export default RegisterForm;