import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { NotificationProvider } from "./context/NotificationContext";
import store from "./redux/store";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </Provider>
  </React.StrictMode>
);
