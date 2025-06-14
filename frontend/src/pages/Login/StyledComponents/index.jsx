import { styled } from "@mui/material/styles";
import { Button, TextField, Box, Paper } from "@mui/material";

export const LoginContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  minHeight: "100vh",
  backgroundColor: theme.palette.background.default,
  justifyContent: "center",
}));

export const LoginCard = styled(Paper)(({ theme }) => ({
  width: "100%",
  maxWidth: 800,
  padding: theme.spacing(4),
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100vh",
  backgroundColor: theme.palette.background.paper,
  borderRadius: 0,
  boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(3),
  },
}));

export const LogoContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  textAlign: "center",
  "& img": {
    maxWidth: 300,
  },
  [theme.breakpoints.down("sm")]: {
    marginBottom: theme.spacing(3),
    "& img": {
      maxWidth: 250,
    },
  },
}));

export const LoginForm = styled("form")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  width: 400,
  marginTop: theme.spacing(1),
  [theme.breakpoints.down("sm")]: {
    width: 350,
  },
}));

export const InputLabel = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(0.5),
  color: theme.palette.secondary.main,
  fontSize: "0.875rem",
  fontWeight: 600,
  width: "100%",
  textAlign: "left",
}));

export const CustomTextField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  "& .MuiOutlinedInput-root": {
    height: "45px",
    "&.Mui-focused fieldset": {
      borderColor: theme.palette.primary.main,
    },
  },
  "& .MuiInputLabel-root": {
    display: "none",
  },
}));

export const SubmitButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(3, 0, 2),
  padding: theme.spacing(1, 0),
  borderRadius: 10,
  fontWeight: 600,
  fontSize: "1.2rem",
  width: 160,
  height: 45,
  alignSelf: "center",
}));

export const LinkContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  textAlign: "center",
  fontWeight: 600,
}));

export const ErrorMessage = styled(Box)(({ theme }) => ({
  width: "100%",
  padding: theme.spacing(1),
  color: theme.palette.error.main,
  borderRadius: theme.spacing(0.5),
  fontSize: "0.875rem",
}));
