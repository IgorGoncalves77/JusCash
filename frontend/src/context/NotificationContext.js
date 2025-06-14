import React, { createContext, useContext, useState, useCallback } from "react";
import { Notification } from "../components/Notification";

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState({
    message: "",
    type: "info",
    visible: false,
  });

  const showNotification = useCallback(
    (message, type = "info", duration = 5000) => {
      console.log("Showing notification:", message, type);
      setNotification({
        message,
        type,
        visible: true,
      });

      if (duration) {
        setTimeout(() => {
          setNotification((prev) => ({ ...prev, visible: false }));
        }, duration);
      }
    },
    []
  );

  const hideNotification = useCallback(() => {
    setNotification((prev) => ({ ...prev, visible: false }));
  }, []);

  const value = {
    notification,
    showNotification,
    hideNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Notification
        message={notification.message}
        type={notification.type}
        visible={notification.visible}
      />
    </NotificationContext.Provider>
  );
};
