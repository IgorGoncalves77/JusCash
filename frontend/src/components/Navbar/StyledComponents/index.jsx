import { styled } from "@mui/material/styles";
import { AppBar, Toolbar, Box } from "@mui/material";

export const NavbarContainer = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderBottom: `2px solid ${theme.palette.grey[200]}`,
  minHeight: 75,
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
}));

export const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  minHeight: 75,
  width: "100%",
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
}));

export const LogoContainer = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  "& img": {
    height: 25,
    marginRight: theme.spacing(1),
  },
  [theme.breakpoints.down("sm")]: {
    "& img": {
      height: 15,
    },
  },
}));

export const LogoutButton = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  color: theme.palette.secondary.main,
  cursor: "pointer",
  textDecoration: "none",
  fontSize: 14,
  transition: "color 0.3s ease",

  "&:hover": {
    color: theme.palette.text.secondary,
    "& svg": {
      color: theme.palette.text.secondary,
    },
  },

  "& svg": {
    marginRight: theme.spacing(0.5),
    color: theme.palette.text.primary,
    transition: "color 0.3s ease",
  },

  [theme.breakpoints.down("sm")]: {
    "& span": {
      display: "none",
    },
  },
}));
