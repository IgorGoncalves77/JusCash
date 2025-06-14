import React from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Box } from "@mui/material";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import { logout } from "../../redux/reducers/sistema/authReducer";
import {
  NavbarContainer,
  StyledToolbar,
  LogoContainer,
  LogoutButton,
} from "./StyledComponents";
import logo from "../../assets/logo.webp";

export const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <NavbarContainer position="static">
      <StyledToolbar>
        <LogoContainer>
          <Box component="img" src={logo} alt="JusCash" />
        </LogoContainer>

        <Box sx={{ flexGrow: 1 }} />

        <LogoutButton onClick={handleLogout}>
          <ExitToAppIcon sx={{ transform: "scaleX(-1)" }} />
          <Box>Sair</Box>
        </LogoutButton>
      </StyledToolbar>
    </NavbarContainer>
  );
};
