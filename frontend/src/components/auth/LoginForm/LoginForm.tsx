import {Box, Button, TextField, Typography} from "@mui/material";
import {useState} from "react";
import * as React from "react";
import useLogin from "../../../hooks/useLogin";
import AuthCard from "../AuthCard/AuthCard";
import RoleToggle, {type AuthRole} from "../RoleToggle/RoleToggle";
import {AUTH_GRADIENT} from "../authStyles";

interface LoginFormProps {
    onClose: () => void;
    onSwitchToRegister: () => void;
    onLoginSuccess: () => void;
}

interface FormData {
    email: string;
    username: string;
    password: string;
}

const initialFormData: FormData = {
    email: "",
    username: "",
    password: "",
};

const LoginForm = ({
                       onClose,
                       onSwitchToRegister,
                       onLoginSuccess,
                   }: LoginFormProps) => {
    const [role, setRole] = useState<AuthRole>("doctor");
    const [formData, setFormData] = useState<FormData>(initialFormData);

    const {login, loading, error} = useLogin();

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = event.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        let success: boolean;

        if (role === "doctor") {
            success = await login({
                role: "doctor",
                email: formData.email,
                password: formData.password,
            });
        } else {
            success = await login({
                role: "patient",
                username: formData.username,
                password: formData.password,
            });
        }

        if (success) {
            onLoginSuccess();
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
            title="Добредојдовте"
            subtitle="Најавете се во вашата NephroCore сметка"
            onClose={onClose}
        >
            <RoleToggle value={role} onChange={setRole}/>

            <Box component="form" onSubmit={handleSubmit}>
                {role === "doctor" ? (
                    <>
                        <Typography variant="body2" sx={labelStyles}>
                            Е-пошта
                        </Typography>

                        <TextField
                            fullWidth
                            name="email"
                            type="email"
                            placeholder="vashata@email.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            sx={{
                                ...inputStyles,
                                mb: 2,
                            }}
                        />
                    </>
                ) : (
                    <>
                        <Typography variant="body2" sx={labelStyles}>
                            Корисничко име
                        </Typography>

                        <TextField
                            fullWidth
                            name="username"
                            placeholder="Вашето корисничко име"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            sx={{
                                ...inputStyles,
                                mb: 2,
                            }}
                        />
                    </>
                )}

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
                    sx={{
                        ...inputStyles,
                        mb: 3,
                    }}
                />

                {error && (
                    <Typography
                        variant="body2"
                        color="error"
                        sx={{mb: 2}}
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
                    {loading ? "Најавување…" : "Најава"}
                </Button>

                <Typography
                    variant="body2"
                    align="center"
                    color="text.secondary"
                    sx={{mt: 3}}
                >
                    Немате сметка?{" "}
                    <Button
                        type="button"
                        onClick={onSwitchToRegister}
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
                        Регистрирајте се
                    </Button>
                </Typography>
            </Box>
        </AuthCard>
    );
};

export default LoginForm;