import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Toaster } from "sonner";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-right"
      richColors
      closeButton
      duration={3000}
      expand
    />
  </StrictMode>,
);
