import { useState, useEffect, useCallback } from 'react';
import { isIOS, isStandalone, canInstall, wasDismissed, markDismissed } from '../pwa/platformDetection';
import PWAInstallBanner from './PWAInstallBanner';
import IOSInstallInstructions from './IOSInstallInstructions';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallManager() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOS, setShowIOS] = useState(false);

  useEffect(() => {
    if (isStandalone() || wasDismissed() || !canInstall()) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    if (isIOS() && !isStandalone()) {
      setTimeout(() => setShowBanner(true), 2000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (isIOS()) {
      setShowBanner(false);
      setShowIOS(true);
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowBanner(false);
    if (outcome === 'dismissed') {
      markDismissed();
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    markDismissed();
  }, []);

  return (
    <>
      <PWAInstallBanner show={showBanner} onInstall={handleInstall} onDismiss={handleDismiss} />
      <IOSInstallInstructions open={showIOS} onClose={() => setShowIOS(false)} />
    </>
  );
}
