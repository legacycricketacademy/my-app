import { useState, useEffect } from 'react';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function OfflineDetector() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Update network status
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Listen for network status changes
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Clean up
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <Alert variant="destructive" className="fixed bottom-0 left-0 right-0 z-50 mx-4 mb-4 shadow-lg">
      <WifiOff className="h-4 w-4" />
      <AlertTitle>You're offline</AlertTitle>
      <AlertDescription>
        Some features may be limited until your connection is restored. The app will continue to function with previously loaded data.
      </AlertDescription>
    </Alert>
  );
}

// Component to show when transitioning back online
export function OnlineStatusIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOnlineMessage, setShowOnlineMessage] = useState(false);

  useEffect(() => {
    // Update network status
    const handleOnline = () => {
      setIsOnline(true);
      
      // Show message for 3 seconds when coming back online
      setShowOnlineMessage(true);
      setTimeout(() => {
        setShowOnlineMessage(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOnlineMessage(false);
    };

    // Listen for network status changes
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Clean up
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showOnlineMessage) {
    return null;
  }

  return (
    <Alert className="fixed bottom-0 left-0 right-0 z-50 mx-4 mb-4 bg-green-50 border-green-500 text-green-900 shadow-lg">
      <Wifi className="h-4 w-4 text-green-600" />
      <AlertTitle className="text-green-800">You're back online</AlertTitle>
      <AlertDescription className="text-green-700">
        Your connection has been restored. All features are now available.
      </AlertDescription>
    </Alert>
  );
}