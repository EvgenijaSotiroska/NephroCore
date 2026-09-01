import "./HomePage.css";
import {Box, Button, Typography} from "@mui/material";
import {
    AUTH_GRADIENT,
    AUTH_SANS_FONT,
    AUTH_SERIF_FONT,
} from "../../components/auth/authStyles";
import {useOutletContext} from "react-router";


interface AuthContext {
    openLogin: () => void;
    openRegister: () => void;
}

const HomePage = () => {
    const {openLogin, openRegister} = useOutletContext<AuthContext>();

    return (
        <Box className="home-hero">
            <Box className="home-hero-overlay"/>

            <Box className="home-hero-content">
                <Box className="home-badge">
                    <Box className="home-badge-dot"/>
                    Следење · Анализа · Поддршка
                </Box>

                <Typography
                    variant="h2"
                    className="home-title"
                    sx={{
                        fontFamily: AUTH_SERIF_FONT,
                    }}
                >
                    Вашето здравје,
                    <br/>
                    <Box
                        component="span"
                        className="home-title-gradient"
                        sx={{
                            background: AUTH_GRADIENT,
                        }}
                    >
                        наш приоритет.
                    </Box>
                </Typography>

                <Typography
                    variant="body1"
                    className="home-description"
                    sx={{
                        fontFamily: AUTH_SANS_FONT,
                    }}
                >
                    Врвни нефролози, персонализирана грижа и напредна технологија — сè
                    на едно место. Тука сме за секој чекор од вашето здравствено
                    патување.
                </Typography>

                <Box className="home-buttons">
                    <Button
                        onClick={openRegister}
                        className="home-button home-button-primary"
                        sx={{
                            background: AUTH_GRADIENT,
                            fontFamily: AUTH_SANS_FONT,
                        }}
                    >
                        Започнете сега
                    </Button>

                    <Button
                        onClick={openLogin}
                        className="home-button home-button-secondary"
                        sx={{
                            fontFamily: AUTH_SANS_FONT,
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