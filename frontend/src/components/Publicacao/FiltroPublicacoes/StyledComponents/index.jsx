import { styled } from "@mui/material/styles";
import { Box, TextField, Typography, Button } from "@mui/material";

export const FiltersContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(4),
  alignItems: "flex-end",
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: theme.spacing(2),
  },
}));

export const SearchContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  flexGrow: 2,
  minWidth: 350,
  [theme.breakpoints.up("md")]: {
    maxWidth: "100%",
  },
}));

export const DateContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  [theme.breakpoints.down("md")]: {
    marginTop: theme.spacing(1),
  },
}));

export const TitleContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: theme.spacing(1.5),
  width: "100%",
}));

export const Label = styled(Typography)(({ theme }) => ({
  color: theme.palette.secondary.main,
  fontWeight: 600,
  marginBottom: theme.spacing(0.5),
}));

export const LabelDate = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontWeight: 400,
  height: 32,
  display: "flex",
  alignItems: "center",
  whiteSpace: "nowrap",
}));

export const SearchTextField = styled(TextField)(({ theme }) => ({
  width: "100%",
  marginBottom: 0,
  "& .MuiOutlinedInput-root": {
    borderRadius: 8,
    height: 32,
    fontSize: "0.875rem",
  },
}));

export const StyledTextField = styled(TextField)(({ theme }) => ({
  flex: 1,
  marginBottom: 0,
  "& .MuiOutlinedInput-root": {
    borderRadius: 8,
    height: 32,
    fontSize: "0.875rem",
    color: theme.palette.text.secondary,
  },
  [theme.breakpoints.down("sm")]: {
    width: 140,
  },
}));

export const InlineGroup = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: theme.spacing(1.5),
  width: "100%",
  [theme.breakpoints.down("sm")]: {
    flexDirection: "row",
    alignItems: "flex-start",
    "& > *": {
      marginBottom: theme.spacing(1),
    },
  },
}));

export const SearchButton = styled(Button)(({ theme }) => ({
  minWidth: 32,
  height: 32,
  borderRadius: 8,
  padding: 0,
  backgroundColor: theme.palette.success.main,
  color: "#fff",
  flexShrink: 0,
  "&:hover": {
    backgroundColor: theme.palette.success.dark,
  },
}));

export const ClearButton = styled(Button)(({ theme }) => ({
  height: 32,
  padding: "0 12px",
  borderRadius: 8,
  textTransform: "none",
  flexShrink: 0,
}));
