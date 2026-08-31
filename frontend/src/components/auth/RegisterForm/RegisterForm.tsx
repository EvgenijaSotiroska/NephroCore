import { Box, Button, TextField, Typography } from "@mui/material";
import { useState } from "react";
import * as React from "react";
import useRegister from "../../../hooks/useRegister";
import AuthCard from "../AuthCard/AuthCard";
import RoleToggle, { type AuthRole } from "../RoleToggle/RoleToggle";
import { AUTH_GRADIENT } from "../authStyles";

interface RegisterFormProps {
  onClose: () => void;
  onSwitchToLogin: () => void;
  onSwitchToActivate: () => void;
  onRegisterSuccess: () => void;
}

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

const RegisterForm = ({
  onClose,
  onSwitchToLogin,
  onSwitchToActivate,
  onRegisterSuccess,
}: RegisterFormProps) => {
  const [role, setRole] = useState<AuthRole>("doctor");
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const { register, error, loading } = useRegister();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const success = await register({
      username: formData.email,
      email: formData.email,
      password: formData.password,
      first_name: formData.firstName,
      last_name: formData.lastName,
      hospital: formData.hospital || undefined,
    });

    if (success) {
      onRegisterSuccess();
    }
  };

  const labelStyles = {
    color: "#6b7280",
    fontWeight: 600,
    mb: 0.5,
  };

  const inputStyles = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "14px",
      backgroundColor: "#fafafa",

      "& fieldset": {
        borderColor: "#e0e0e0",
      },

      "&:hover fieldset": {
        borderColor: "#bdbdbd",
      },

      "&.Mui-focused fieldset": {
        borderColor: "#14b8a6",
        borderWidth: "1px",
      },
    },

    "& .MuiInputBase-input": {
      py: 1.5,
    },

    "& .MuiInputBase-input::placeholder": {
      color: "#a0a0a0",
      opacity: 1,
    },
  };

  return (
    <AuthCard
      title="Создадете сметка"
      subtitle="Придружете се на NephroCore платформата"
      onClose={onClose}
    >
      <RoleToggle value={role} onChange={setRole} />

      {role === "patient" ? (
        <Box sx={{ textAlign: "center", py: 2 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2 }}
          >
            Пациентите добиваат пристап преку код за покана од својот доктор.
            Ако веќе имате код, активирајте ја вашата сметка тука.
          </Typography>

          <Button
            fullWidth
            onClick={onSwitchToActivate}
            sx={{
              background: AUTH_GRADIENT,
              color: "white",
              fontWeight: 600,
              py: 1.25,
              borderRadius: 2,
              textTransform: "none",

              "&:hover": {
                background: AUTH_GRADIENT,
                opacity: 0.9,
              },
            }}
          >
            Активирај сметка
          </Button>
        </Box>
      ) : (
        <Box component="form" onSubmit={handleSubmit}>
          {/* Име + Презиме */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexDirection: { xs: "column", sm: "row" },
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={labelStyles}>
                Име
              </Typography>

              <TextField
                fullWidth
                name="firstName"
                placeholder="Марија"
                value={formData.firstName}
                onChange={handleChange}
                required
                sx={{ ...inputStyles, mb: 2 }}
              />
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={labelStyles}>
                Презиме
              </Typography>

              <TextField
                fullWidth
                name="lastName"
                placeholder="Петрова"
                value={formData.lastName}
                onChange={handleChange}
                required
                sx={{ ...inputStyles, mb: 2 }}
              />
            </Box>
          </Box>

          {/* Болница */}
          <Typography variant="body2" sx={labelStyles}>
            Болница
          </Typography>

          <TextField
            fullWidth
            name="hospital"
            placeholder="Клинички центар Скопје"
            value={formData.hospital}
            onChange={handleChange}
            sx={{ ...inputStyles, mb: 2 }}
          />

          {/* Е-пошта */}
          <Typography variant="body2" sx={labelStyles}>
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
            sx={{ ...inputStyles, mb: 2 }}
          />

          {/* Лозинка */}
          <Typography variant="body2" sx={labelStyles}>
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
            sx={{ ...inputStyles, mb: 3 }}
          />

          {/* Error */}
          {error && (
            <Typography
              variant="body2"
              color="error"
              sx={{ mb: 2 }}
            >
              {error}
            </Typography>
          )}

          {/* Register button */}
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

              "&:hover": {
                background: AUTH_GRADIENT,
                opacity: 0.9,
              },
            }}
          >
            {loading ? "Регистрација…" : "Регистрација"}
          </Button>

          {/* Switch to login */}
          <Typography
            variant="body2"
            align="center"
            color="text.secondary"
            sx={{ mt: 3 }}
          >
            Веќе имате сметка?{" "}
            <Button
              type="button"
              onClick={onSwitchToLogin}
              sx={{
                p: 0,
                minWidth: "auto",
                textTransform: "none",
                fontSize: "inherit",
                fontWeight: 500,
                verticalAlign: "baseline",
                color: "#14b8a6",

                "&:hover": {
                  background: "transparent",
                  textDecoration: "underline",
                },
              }}
            >
              Најавете се
            </Button>
          </Typography>
        </Box>
      )}
    </AuthCard>
  );
};

export default RegisterForm;

