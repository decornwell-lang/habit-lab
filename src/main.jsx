// Entry point: loads the global styles and mounts the app on the page.
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./styles/theme.css";
import { captureInstallPrompt } from "./lib/install.js";
import { fixViewportOnReturn } from "./lib/viewportFix.js";

captureInstallPrompt(); // so "Add to Home Screen" buttons can open the install prompt
fixViewportOnReturn(); // iPhone: the tab bar stays at the bottom after sharing

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
