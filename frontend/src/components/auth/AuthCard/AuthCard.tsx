import { Box, Container, IconButton, Paper, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import * as React from "react";
import { AUTH_GRADIENT, AUTH_SERIF_FONT } from "../authStyles";

interface AuthCardProps {
  title: string;
  subtitle: string;
  onClose?: () => void;
  children: React.ReactNode;
}

const AuthCard = ({
  title,
  subtitle,
  onClose,
  children,
}: AuthCardProps) => {
  return (
    <Container
      maxWidth="xs"
      sx={{
        py: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          position: "relative",
          borderRadius: 4,
          border: "1px solid",
          borderColor: "grey.200",
          p: 4,

          // Keep the card within the viewport
          maxHeight: "90vh",

          display: "flex",
          flexDirection: "column",

          overflow: "hidden",
        }}
      >
        {/* Close button */}
        {onClose && (
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              color: "grey.500",
              zIndex: 2,

              "&:hover": {
                backgroundColor: "grey.100",
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}

        {/* Fixed header */}
        <Box
          sx={{
            flexShrink: 0,
            textAlign: "center",
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "16px",
              background: AUTH_GRADIENT,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
            }}
          >
            <LocalHospitalIcon sx={{ color: "white" }} />
          </Box>

          <Typography
            variant="h4"
            align="center"
            sx={{
              fontFamily: AUTH_SERIF_FONT,
              fontWeight: 500,
              mb: 0.5,
            }}
          >
            {title}
          </Typography>

          <Typography
            variant="body2"
            align="center"
            color="text.secondary"
            sx={{
              mb: 3,
            }}
          >
            {subtitle}
          </Typography>
        </Box>

        {/* Scrollable form content */}
        <Box
          sx={{
            overflowY: "auto",
            overflowX: "hidden",
            flex: 1,
            minHeight: 0,

            // Small scrollbar
            "&::-webkit-scrollbar": {
              width: "5px",
            },

            "&::-webkit-scrollbar-track": {
              background: "transparent",
            },

            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "rgba(0, 0, 0, 0.2)",
              borderRadius: "10px",
            },

            "&::-webkit-scrollbar-thumb:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.35)",
            },

            // Firefox
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(0, 0, 0, 0.2) transparent",

            pr: 0.5,
          }}
        >
          {children}
        </Box>
      </Paper>
    </Container>
  );
};

export default AuthCard;

