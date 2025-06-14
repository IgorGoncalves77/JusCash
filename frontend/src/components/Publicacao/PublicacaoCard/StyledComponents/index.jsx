import { styled } from "@mui/material/styles";
import { Box } from "@mui/material";

export const CardContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5),
  marginBottom: theme.spacing(1.5),
  backgroundColor: "#fff",
  borderRadius: theme.shape.borderRadius,
  boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
  transition: "box-shadow 0.2s ease",
  "&:hover": {
    boxShadow: "0 4px 8px rgba(0,0,0,0.12)",
  },
  cursor: "pointer",
}));
