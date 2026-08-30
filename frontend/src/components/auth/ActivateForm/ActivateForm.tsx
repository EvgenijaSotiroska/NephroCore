import { Box, Button, TextField, Typography } from "@mui/material";
import { useState } from "react";
import * as React from "react";
import { useNavigate } from "react-router";
import useActivate from "../../../hooks/useActivate";
import AuthCard from "../AuthCard/AuthCard";
import { AUTH_GRADIENT } from "../authStyles";

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

const ActivateForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const { activate, error, loading } = useActivate();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await activate({
      invite_code: formData.inviteCode,
      username: formData.username,
      password: formData.password,
    });
  };

  return (
    <AuthCard
      title="Активирајте ја сметката"
      subtitle="Внесете го кодот за покана добиен од вашиот доктор"
      onClose={() => navigate("/login")}
    >
      <Box component="form" onSubmit={handleSubmit}>
        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
          Код за покана
        </Typography>
        <TextField
          fullWidth
          name="inviteCode"
          placeholder="напр. aB3xQ9pL2k"
          value={formData.inviteCode}
          onChange={handleChange}
          required
          sx={{ mb: 2 }}
        />

        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
          Изберете корисничко име
        </Typography>
        <TextField
          fullWidth
          name="username"
          placeholder="korisnichko_ime"
          value={formData.username}
          onChange={handleChange}
          required
          sx={{ mb: 2 }}
        />

        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
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
          {loading ? "Активирање…" : "Активирај"}
        </Button>
      </Box>
    </AuthCard>
  );
};

export default ActivateForm;