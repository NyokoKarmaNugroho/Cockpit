import "./utils/supabase";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import { App } from "./App";
import { DocumentMeta } from "./components/DocumentMeta";
import { AppProviders } from "./providers/AppProviders";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <DocumentMeta />
      <AppProviders>
        <App />
      </AppProviders>
    </BrowserRouter>
  </StrictMode>
);
