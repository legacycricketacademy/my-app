import { createRoot } from "react-dom/client";
import App from "./App";
import MinimalApp from "./MinimalApp";
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

// Load either our normal app or the minimal test app
// Comment out one of these lines to test
// createRoot(document.getElementById("root")!).render(<App />);
createRoot(document.getElementById("root")!).render(<MinimalApp />);

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
