import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SessionContextProvider } from "@/contexts/SessionContext";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SessionContextProvider>
      <App />
    </SessionContextProvider>
  </StrictMode>,
);
