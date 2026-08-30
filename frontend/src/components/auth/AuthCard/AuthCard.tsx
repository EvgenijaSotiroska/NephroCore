import { Box, Container, IconButton, Paper, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import MedicalInformationIcon from "@mui/icons-material/MedicalInformation";
import * as React from "react";
import { AUTH_GRADIENT, AUTH_SERIF_FONT } from "../authStyles";

interface AuthCardProps {
  title: string;
  subtitle: string;
  onClose?: () => void;
  children: React.ReactNode;
}

const AuthCard = ({ title, subtitle, onClose, children }: AuthCardProps) => {
  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Paper
        elevation={0}
        sx={{
          position: "relative",
          borderRadius: 4,
          border: "1px solid",
          borderColor: "grey.200",
          p: 4,
        }}
      >
        {onClose && (
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ position: "absolute", top: 16, right: 16, color: "grey.500" }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}

        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: AUTH_GRADIENT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 2,
          }}
        >
          <MedicalInformationIcon sx={{ color: "white" }} />
        </Box>

        <Typography
          variant="h4"
          align="center"
          sx={{ fontFamily: AUTH_SERIF_FONT, fontWeight: 500, mb: 0.5 }}
        >
          {title}
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
          {subtitle}
        </Typography>

        {children}
      </Paper>
    </Container>
  );
};

export default AuthCard;