import "./Layout.css";
import { Box } from "@mui/material";
import { Outlet } from "react-router";
import Header from "../Header/Header";

const Layout = () => {
  return (
    <Box className="layout-box">
      <Header />
      <Box className="outlet-box">
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;