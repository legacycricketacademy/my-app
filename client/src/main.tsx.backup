// Use globals from CDN first, fall back to imports if needed
// @ts-ignore - Using globals from CDN
const ReactFromCDN = window.React;
// @ts-ignore - Using globals from CDN
const ReactDOMFromCDN = window.ReactDOM;

// Fallback imports - will be used if CDN didn't load
import React from "react";
import { createRoot } from "react-dom/client";

// Log the React source we're using
console.log("React available:", 
  ReactFromCDN ? "Yes (from CDN)" : 
  typeof React !== 'undefined' ? "Yes (from import)" : "No");

console.log("ReactDOM available:", 
  ReactDOMFromCDN ? "Yes (from CDN)" : 
  typeof createRoot !== 'undefined' ? "Yes (from import)" : "No");

// Use the first available version of each dependency
const ReactImpl = ReactFromCDN || React;
const createRootImpl = 
  ReactDOMFromCDN?.createRoot || 
  createRoot || 
  null;

// Import minimal app only to keep dependencies simple
import "./index.css";

// Enhanced error logging for debugging
const originalError = console.error;
console.error = function(...args) {
  // Log original error
  originalError.apply(console, args);
  
  // Add enhanced error info for API calls
  if (args[0] && typeof args[0] === 'string' && args[0].includes('API call')) {
    try {
      const errorDetails = args.slice(1).map(arg => {
        if (arg instanceof Error) {
          return {
            name: arg.name,
            message: arg.message,
            stack: arg.stack
          };
        }
        return arg;
      });
      
      originalError.call(console, '🔍 Enhanced Error Information:', errorDetails);
    } catch (e) {
      // If our enhanced logging fails, fall back to original error
      originalError.call(console, 'Enhanced logging failed:', e);
    }
  }
};

// Mobile viewport adjustment for iOS devices
function setViewportForMobile() {
  // Check if we're running in a mobile browser
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (isMobile) {
    // Force the viewport to be correctly sized on mobile (especially for iOS)
    const meta = document.querySelector('meta[name="viewport"]');
    if (meta) {
      meta.setAttribute('content', 
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
    
    // Add specific mobile class to body for responsive styling
    document.body.classList.add('mobile-device');
    
    // Calculate viewport height for iOS (to handle address bar issues)
    const setVhVariable = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    // Set initially and on resize
    setVhVariable();
    window.addEventListener('resize', setVhVariable);
  }
}

// Call viewport adjustment
setViewportForMobile();

// Load our minimal React app without complex dependencies
import MinimalReactApp from './MinimalReactApp';
const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("Failed to find root element in the DOM");
} else {
  try {
    console.log("Attempting to render React app...");
    
    // Try using CDN version first with modern createRoot method
    if (ReactDOMFromCDN?.createRoot) {
      console.log("Using ReactDOM.createRoot from CDN");
      ReactDOMFromCDN.createRoot(rootElement).render(
        ReactFromCDN.createElement(MinimalReactApp)
      );
    }
    // Next try using the imported createRoot method
    else if (createRootImpl) {
      console.log("Using createRoot from import");
      createRootImpl(rootElement).render(
        ReactImpl.createElement(MinimalReactApp)
      );
    }
    // Last resort: try the legacy render method if available
    else if (ReactDOMFromCDN?.render) {
      console.log("Using legacy ReactDOM.render from CDN");
      ReactDOMFromCDN.render(
        ReactFromCDN.createElement(MinimalReactApp),
        rootElement
      );
    }
    // If all methods fail, we have no way to render React
    else {
      throw new Error("No React rendering method available");
    }
    
    console.log("React rendering completed");
  } catch (error) {
    console.error("Error rendering React app:", error);
    
    // If React rendering fails, display a fallback message directly in the DOM
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: system-ui, sans-serif;">
        <h1 style="color: #e53e3e; font-size: 24px; margin-bottom: 16px;">React Rendering Error</h1>
        <p style="margin-bottom: 16px;">There was an error rendering the React application.</p>
        <div style="background: #f7fafc; padding: 15px; border-radius: 5px; overflow: auto; font-family: monospace;">
          ${error instanceof Error ? error.message : String(error)}
        </div>
        <div style="margin-top: 20px;">
          <p>Try these troubleshooting options:</p>
          <ul style="margin-top: 8px; margin-left: 20px;">
            <li><a href="/direct-react-test" style="color: #3182ce;">Visit Direct React Test Page</a></li>
            <li><a href="/diagnostic" style="color: #3182ce;">View System Diagnostics</a></li>
            <li><a href="#" onclick="window.location.reload(); return false;" style="color: #3182ce;">Refresh the page</a></li>
          </ul>
        </div>
      </div>
    `;
  }
}

// Register service worker for PWA if in production
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}
