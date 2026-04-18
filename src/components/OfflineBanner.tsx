import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setJustReconnected(true);
      setTimeout(() => setJustReconnected(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setJustReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !justReconnected) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-in slide-in-from-top duration-300">
      {!isOnline ? (
        <Alert className="bg-[#FF6F91] text-white border-none rounded-none shadow-lg">
          <WifiOff className="h-4 w-4" />
          <AlertDescription className="ml-2">
            You're offline. Some features may not work until you reconnect.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="bg-[#6DE7C5] text-white border-none rounded-none shadow-lg">
          <Wifi className="h-4 w-4" />
          <AlertDescription className="ml-2">
            You're back online! Syncing your data...
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
