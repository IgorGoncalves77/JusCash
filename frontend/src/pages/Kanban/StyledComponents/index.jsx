import { styled } from "@mui/material/styles";
import { Box, Typography } from "@mui/material";
import BalanceIcon from "@mui/icons-material/Balance";

export const KanbanContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  minHeight: "calc(100vh - 75px)",
  padding: theme.spacing(6),
  backgroundColor: "#ffffff",
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
  },
}));

export const HeaderContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  flexWrap: "wrap",
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2),
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
    alignItems: "stretch",
  },
}));

export const HeaderTitleBox = styled(Box)(({ theme }) => ({
  flexBasis: "30%",
  display: "flex",
  alignItems: "center",
  [theme.breakpoints.down("sm")]: {
    flexBasis: "100%",
    justifyContent: "flex-start",
  },
}));

export const TitleIcon = styled(BalanceIcon)(({ theme }) => ({
  marginRight: theme.spacing(1),
  color: theme.palette.secondary.main,
  fontSize: "2rem",

  [theme.breakpoints.down("sm")]: {
    fontSize: "1.5rem",
  },
}));

export const Title = styled(Typography)(({ theme }) => ({
  color: theme.palette.secondary.main,
  fontSize: "2rem",
  fontWeight: 500,
  [theme.breakpoints.down("sm")]: {
    fontSize: "1.5rem",
  },
}));

export const KanbanContent = styled(Box)(({ theme }) => ({
  display: "flex",
  flexGrow: 1,
  overflow: "hidden",
  marginTop: theme.spacing(2),
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
  },
}));

export const KanbanColumnsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexGrow: 1,
  overflow: "auto",
  gap: theme.spacing(2),
  [theme.breakpoints.down("md")]: {
    flexWrap: "nowrap",
  },
}));
