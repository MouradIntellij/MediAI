import React from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./auth/AuthContext.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import App from "./App.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
