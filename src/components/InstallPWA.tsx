import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../lib/i18n';

export default function InstallPWA() {
  const { theme } = useLanguage();
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

  const isDark = theme === "dark";

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          id="pwa-install-banner"
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 pl-4 pr-2 py-2 rounded-full shadow-xl flex items-center gap-2.5 cursor-pointer transition-all border ${
            isDark
              ? "bg-[#0d1222] border-amber-500/40 text-amber-400 hover:border-amber-400 shadow-amber-950/40"
              : "bg-white border-amber-400 text-amber-700 hover:border-amber-500 shadow-amber-500/10"
          }`}
          onClick={handleInstallClick}
        >
          <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
            <Download className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <span className={`text-xs font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
            Installer l'Application
          </span>
          <button
            type="button"
            className={`ml-1 p-1 rounded-full transition-colors cursor-pointer ${
              isDark
                ? "hover:bg-slate-800 text-slate-400 hover:text-white"
                : "hover:bg-slate-100 text-slate-400 hover:text-slate-700"
            }`}
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
