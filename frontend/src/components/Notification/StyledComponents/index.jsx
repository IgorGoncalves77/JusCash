import { styled } from "@mui/material/styles";

export const NotificationContainer = styled('div')(({ theme }) => ({
  position: 'fixed',
  top: theme.spacing(2),
  right: theme.spacing(2),
  zIndex: 9999,
  minWidth: '300px',
  maxWidth: '500px',
})); 