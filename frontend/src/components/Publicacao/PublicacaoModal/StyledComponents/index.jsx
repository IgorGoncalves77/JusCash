import { styled } from "@mui/material/styles";
import { Box, Typography, IconButton } from "@mui/material";

export const ModalContainer = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "90%",
  maxWidth: 500,
  maxHeight: "90vh",
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: "0px 4px 24px rgba(0, 0, 0, 0.15)",
  padding: theme.spacing(2.5),
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(1.5),
    width: "95%",
  },
}));

export const ModalHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: theme.spacing(1.5),
}));

export const ModalTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.secondary.main,
  fontWeight: 600,
  fontSize: "1rem",
}));

export const CloseButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.grey[700],
  padding: theme.spacing(0.5),
}));

export const ModalContent = styled(Box)(({ theme }) => ({
  overflowY: "auto",
  flex: 1,
  padding: theme.spacing(2),
  "&::-webkit-scrollbar": {
    width: "6px",
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: theme.palette.background.default,
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: theme.palette.primary.main,
    borderRadius: "3px",
  },
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(0.5),
    width: "95%",
  },
}));

export const Section = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(1.5),
}));

export const ItemContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  marginBottom: theme.spacing(1),
}));

export const ItemLabel = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: "0.85rem",
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(0.5),
}));

export const ItemValue = styled(Typography)(() => ({
  fontWeight: 400,
  fontSize: "0.85rem",
}));

export const ListItemStyledText = styled(Typography)(({ theme }) => ({
  fontSize: "0.85rem",
  fontWeight: 400,
  color: theme.palette.text.primary,
}));

export const ConteudoBox = styled(Box)(() => ({
  maxHeight: "200px",
  overflowY: "auto",
  whiteSpace: "pre-line",
}));
