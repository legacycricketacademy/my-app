import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log("Loading full Cricket Academy application...");

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("Failed to find root element in the DOM");
} else {
  try {
    console.log("Rendering full React app...");
    const root = createRoot(rootElement);
    root.render(<App />);
    console.log("Full React app rendered successfully");
  } catch (error) {
    console.error("Error rendering React app:", error);
    
    // Fallback to minimal app if full app fails
    import('./MinimalReactApp').then(({ default: MinimalReactApp }) => {
      const root = createRoot(rootElement);
      root.render(<MinimalReactApp />);
      console.log("Fallback to minimal app due to error:", error);
    });
  }
}
