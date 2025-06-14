import { styled } from "@mui/material/styles";
import { Box, Paper, Typography } from "@mui/material";

export const ColumnContainer = styled(Paper)(({ theme, status }) => ({
  display: "flex",
  flexDirection: "column",
  flexBasis: "25%",
  flexGrow: 1,
  minWidth: 280,
  height: "calc(100vh - 200px)",
  maxHeight: "calc(100vh - 200px)",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.default,
  [theme.breakpoints.down("md")]: {
    minHeight: 400,
    maxHeight: "none",
  },
}));

export const ColumnHeader = styled(Box)(({ theme }) => ({
  alignItems: "center",
  display: "flex",
  padding: theme.spacing(2),
  border: `2px solid ${theme.palette.grey[300]}`,
  position: "sticky",
  top: 0,
  zIndex: 1,
  backgroundColor: theme.palette.background.default,
}));

export const ColumnTitle = styled(Typography, {
  shouldForwardProp: (prop) => prop !== "isConcluido",
})(({ theme, isConcluido }) => ({
  color: isConcluido
    ? theme.palette.success.main
    : theme.palette.secondary.main,
  display: "flex",
  alignItems: "center",
  fontSize: "0.9rem",
  "& > svg": {
    marginRight: theme.spacing(1),
    fontSize: "1.2rem",
  },
}));

export const CardsContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  overflowY: "auto",
  flexGrow: 1,
  height: "calc(100% - 60px)",
  minHeight: "200px",
  maxHeight: "calc(100% - 60px)",
  overflowX: "hidden",
  scrollbarWidth: "thin",
  scrollbarColor: `${theme.palette.grey[500]} ${theme.palette.background.paper}`,
  "&::-webkit-scrollbar": {
    width: "12px",
    backgroundColor: theme.palette.background.paper,
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: theme.palette.grey[400],
    borderRadius: "6px",
    border: `2px solid ${theme.palette.background.paper}`,
    "&:hover": {
      backgroundColor: theme.palette.primary.light,
    },
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: theme.palette.background.paper,
    borderRadius: "6px",
  },
  touchAction: "manipulation",
  userSelect: "none",
}));

export const EmptyColumn = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  textAlign: "center",
  color: theme.palette.text.secondary,
}));

export const ColumnCount = styled(Box)(({ theme }) => ({
  color: theme.palette.grey[500],
  fontWeight: 500,
  marginLeft: theme.spacing(1),
}));
