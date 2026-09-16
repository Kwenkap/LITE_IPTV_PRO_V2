import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      // Clear the deferredPrompt so it can be garbage collected
      setDeferredPrompt(null);
      setShowPrompt(false);
      console.log('PWA was installed');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  // Fermeture automatique au bout de 30 secondes pour ne pas gêner la navigation
  useEffect(() => {
    if (!showPrompt) return;

    const timer = setTimeout(() => {
      setShowPrompt(false);
    }, 30000);

    return () => clearTimeout(timer);
  }, [showPrompt]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          id="pwa-install-banner"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 hover:bg-indigo-700 text-white pl-4 pr-2 py-2 rounded-full shadow-lg flex items-center gap-2 cursor-pointer transition-colors"
          onClick={handleInstallClick}
        >
          <Download className="w-4 h-4" />
          <span className="text-sm font-medium">Installer l'Application</span>
          <button
            type="button"
            className="ml-1 p-1 rounded-full hover:bg-indigo-800 text-indigo-200 hover:text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setShowPrompt(false);
            }}
            title="Fermer"
            aria-label="Fermer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
