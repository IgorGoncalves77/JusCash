import React from "react";
import { NotificationContainer } from "./StyledComponents";
import { Collapse, Alert } from "@mui/material";

export const Notification = (props) => {
  if (!props.message) {
    return null;
  }

  const isValidSeverity = ["error", "info", "success", "warning"].includes(
    props.type
  );
  const severity = isValidSeverity ? props.type : "info";

  return (
    <Collapse in={props.visible}>
      <NotificationContainer>
        <Alert severity={severity}>{props.message}</Alert>
      </NotificationContainer>
    </Collapse>
  );
};
