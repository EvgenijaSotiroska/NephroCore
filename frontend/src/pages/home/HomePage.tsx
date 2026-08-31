import "./HomePage.css";
import { Box, Button, Typography } from "@mui/material";
import { Link } from "react-router";
import { AUTH_GRADIENT, AUTH_SANS_FONT, AUTH_SERIF_FONT } from "../../components/auth/authStyles";

const HomePage = () => {
  return (
    <Box className="home-hero">
      <Box className="home-hero-overlay" />
      <Box className="home-hero-content">
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            backgroundColor: "rgba(255,255,255,0.1)",
            color: "white",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: "999px",
            px: 2.5,
            py: 1,
            mb: 3,
            fontFamily: AUTH_SANS_FONT,
            fontWeight: 600,
            fontSize: "0.9rem",
            letterSpacing: "0.05em",
          }}
        >
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: "#0ea5e9",
              flexShrink: 0,
            }}
          />
          Следење · Анализа · Поддршка
        </Box>

        <Typography
          variant="h2"
          sx={{
            fontFamily: AUTH_SERIF_FONT,
            color: "white",
            fontWeight: 600,
            lineHeight: 1.15,
            mb: 2.5,
          }}
        >
          Вашето здравје,
          <br />
          <Box
            component="span"
            sx={{
              background: AUTH_GRADIENT,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            наш приоритет.
          </Box>
        </Typography>

        <Typography
          variant="body1"
          sx={{
            fontFamily: AUTH_SANS_FONT,
            color: "rgba(255,255,255,0.85)",
            fontSize: "1.1rem",
            lineHeight: 1.6,
            maxWidth: 520,
          }}
        >
          Врвни нефролози, персонализирана грижа и напредна AI-технологија — сè на едно место.
          Тука сме за секој чекор од вашето здравствено патување.
        </Typography>

        <Box sx={{ display: "flex", gap: 2, mt: 4, flexWrap: "wrap" }}>
          <Button
            component={Link}
            to="/register"
            sx={{
              background: AUTH_GRADIENT,
              color: "white",
              fontFamily: AUTH_SANS_FONT,
              textTransform: "none",
              fontWeight: 700,
              py: 1.75,
              px: 4,
              borderRadius: 3,
              boxShadow: "0 8px 28px rgba(20, 184, 166, 0.55)",
              transition: "box-shadow 0.2s ease, transform 0.2s ease",
              "&:hover": {
                background: AUTH_GRADIENT,
                boxShadow: "0 10px 36px rgba(20, 184, 166, 0.8)",
                transform: "translateY(-1px)",
              },
            }}
          >
            Започнете сега
          </Button>
          <Button
            component={Link}
            to="/login"
            sx={{
              color: "white",
              fontFamily: AUTH_SANS_FONT,
              border: "1px solid rgba(255,255,255,0.4)",
              textTransform: "none",
              fontWeight: 600,
              py: 1.75,
              px: 4,
              borderRadius: 3,
              "&:hover": { backgroundColor: "rgba(255,255,255,0.08)" },
            }}
          >
            Најавете се →
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default HomePage;