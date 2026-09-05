import { Box, Button, TextField, Typography } from "@mui/material";
import { useState } from "react";
import * as React from "react";
import useActivate from "../../../hooks/useActivate";
import AuthCard from "../AuthCard/AuthCard";
import { AUTH_GRADIENT } from "../authStyles";

interface ActivateFormProps {
  onClose: () => void;
  onActivationSuccess: () => void;
}

interface FormData {
  inviteCode: string;
  username: string;
  password: string;
}

const initialFormData: FormData = {
  inviteCode: "",
  username: "",
  password: "",
};

const ActivateForm = ({
  onClose,
  onActivationSuccess,
}: ActivateFormProps) => {
  const [formData, setFormData] =
    useState<FormData>(initialFormData);

  const { activate, error, loading } = useActivate();

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const success = await activate({
      invite_code: formData.inviteCode,
      username: formData.username,
      password: formData.password,
    });

    if (success) {
      onActivationSuccess();
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
      title="Активирајте ја сметката"
      subtitle="Внесете го кодот за покана добиен од вашиот доктор"
      onClose={onClose}
    >
      <Box component="form" onSubmit={handleSubmit}>
        <Typography variant="body2" sx={labelStyles}>
          Код за покана
        </Typography>

        <TextField
          fullWidth
          name="inviteCode"
          placeholder="напр. aB3xQ9pL2k"
          value={formData.inviteCode}
          onChange={handleChange}
          required
          sx={{ ...inputStyles, mb: 2 }}
        />

        <Typography variant="body2" sx={labelStyles}>
          Изберете корисничко име
        </Typography>

        <TextField
          fullWidth
          name="username"
          placeholder="korisnichko_ime"
          value={formData.username}
          onChange={handleChange}
          required
          sx={{ ...inputStyles, mb: 2 }}
        />

        <Typography variant="body2" sx={labelStyles}>
          Изберете лозинка
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

        {error && (
          <Typography
            variant="body2"
            color="error"
            sx={{ mb: 2 }}
          >
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

            "&:hover": {
              background: AUTH_GRADIENT,
              opacity: 0.9,
            },
          }}
        >
          {loading ? "Активирање…" : "Активирај"}
        </Button>
      </Box>
    </AuthCard>
  );
};

export default ActivateForm;