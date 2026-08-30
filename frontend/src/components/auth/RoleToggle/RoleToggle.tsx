import { Box, ButtonBase, Typography } from "@mui/material";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import PersonIcon from "@mui/icons-material/Person";

export type AuthRole = "doctor" | "patient";

interface RoleToggleProps {
  value: AuthRole;
  onChange: (role: AuthRole) => void;
}

const OPTIONS: { role: AuthRole; label: string; icon: React.ReactNode; color: string }[] = [
  { role: "doctor", label: "Доктор", icon: <MedicalServicesIcon fontSize="small" />, color: "#0ea5e9" },
  { role: "patient", label: "Пациент", icon: <PersonIcon fontSize="small" />, color: "#1e293b" },
];

const RoleToggle = ({ value, onChange }: RoleToggleProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        background: "#f1f2f4",
        borderRadius: 3,
        p: "4px",
        mb: 3,
      }}
    >
      {OPTIONS.map((option) => {
        const active = option.role === value;
        return (
          <ButtonBase
            key={option.role}
            onClick={() => onChange(option.role)}
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.75,
              py: 1,
              borderRadius: 2.5,
              background: active ? "white" : "transparent",
              boxShadow: active ? "0 1px 3px rgba(0,0,0,0.15)" : "none",
              color: active ? option.color : "text.secondary",
              transition: "all 0.15s ease",
            }}
          >
            {option.icon}
            <Typography variant="body2" fontWeight={600}>
              {option.label}
            </Typography>
          </ButtonBase>
        );
      })}
    </Box>
  );
};

export default RoleToggle;