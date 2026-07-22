import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Tv, Maximize, Minimize, ChevronLeft, ShieldCheck, Wifi, Clock, Fullscreen, AlertTriangle
} from "lucide-react";

interface IPTVPlayerProps {
  url: string;
  username: string;
  expiresAt: number;
  onClose: () => void;
  onSessionExpired: () => void;
}

export default function IPTVPlayer({ url, username, expiresAt, onClose, onSessionExpired }: IPTVPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showControls, setShowControls] = useState(true);
  
  const [timeRemaining, setTimeRemaining] = useState<number>(() => {
    return Math.max(0, expiresAt - Date.now());
  });
  const [showWarningToast, setShowWarningToast] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Periodic background check to immediately disconnect if account expires or gets deleted/expired on the server
  useEffect(() => {
    if (!username || !expiresAt) return;

    const checkInterval = setInterval(async () => {
      const now = Date.now();
      const diff = expiresAt - now;
      const remaining = Math.max(0, diff);
      setTimeRemaining(remaining);

      // Show warning toast if 5 mins (300,000 ms) or less are remaining
      if (remaining > 0 && remaining <= 300000) {
        setShowWarningToast(true);
      } else {
        setShowWarningToast(false);
      }

      // 1. Client-side local time check (immediate, no network required)
      if (now > expiresAt) {
        clearInterval(checkInterval);
        try {
          await fetch("/api/logs/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username,
              event: "expired",
              details: "Abonnement expiré en cours de visionnage (Vérification locale)"
            }),
          });
        } catch (e) {
          console.warn("Log expiration check failed:", e);
        }
        onSessionExpired();
        return;
      }

      // 2. Server-side/DB sync check
      try {
        const response = await fetch(`/api/session/check-status?username=${encodeURIComponent(username)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.status === "expired") {
            clearInterval(checkInterval);
            try {
              await fetch("/api/logs/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  username,
                  event: "expired",
                  details: `Compte désactivé ou expiré sur le serveur (Raison: ${data.reason || "inconnue"})`
                }),
              });
            } catch (e) {
              console.warn("Log expiration check failed:", e);
            }
            onSessionExpired();
          }
        }
      } catch (err) {
        console.warn("Erreur d'arrière-plan lors de la vérification de session :", err);
      }
    }, 4000); // Highly responsive but quota-friendly check every 4 seconds

    return () => clearInterval(checkInterval);
  }, [username, expiresAt, onSessionExpired]);

  // Update clock and timeRemaining every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      const now = Date.now();
      const diff = expiresAt - now;
      const remaining = Math.max(0, diff);
      setTimeRemaining(remaining);

      if (remaining > 0 && remaining <= 300000) {
        setShowWarningToast(true);
      } else {
        setShowWarningToast(false);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const formatTimeRemaining = (ms: number) => {
    if (ms <= 0) return "Expiré";
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  const handleClosePlayer = async () => {
    try {
      await fetch("/api/logs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          event: "logout",
          details: "Déconnexion volontaire du lecteur IPTV"
        }),
      });
    } catch (e) {
      console.warn("Audit log logout failed:", e);
    }
    onClose();
  };

  // Handle stream load simulation
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [url]);

  // Autohide controls on idle
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 2500);
  };

  useEffect(() => {
    handleMouseMove();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Toggle full browser screen (HTML5 Fullscreen API)
  const toggleFullScreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
        .then(() => setIsFullScreen(true))
        .catch((err) => {
          console.error("Error entering fullscreen:", err);
        });
    } else {
      document.exitFullscreen()
        .then(() => setIsFullScreen(false))
        .catch((err) => {
          console.error("Error exiting fullscreen:", err);
        });
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Try to launch browser fullscreen automatically upon launch
  useEffect(() => {
    const autoFullscreenTimer = setTimeout(() => {
      if (containerRef.current && !document.fullscreenElement) {
        containerRef.current.requestFullscreen()
          .then(() => setIsFullScreen(true))
          .catch(() => {
            // Browsers often require a user gesture first, so we quietly fail if blocked
          });
      }
    }, 500);
    return () => clearTimeout(autoFullscreenTimer);
  }, []);

  const isDirectVideo = url.endsWith(".m3u8") || url.endsWith(".mp4") || url.endsWith(".webm") || url.endsWith(".ogg");

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onClick={handleMouseMove}
      className="fixed inset-0 w-full h-full bg-black z-50 overflow-hidden flex flex-col justify-center items-center select-none"
      id="iptv-immersive-fullscreen-player"
    >
      {/* Absolute background stream */}
      <div className="absolute inset-0 w-full h-full z-10 bg-black">
        {isDirectVideo ? (
          <video
            src={url}
            autoPlay={isPlaying}
            controls
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        ) : (
          <iframe
            src={url}
            className="w-full h-full border-0 bg-black"
            allow="autoplay; fullscreen; picture-in-picture"
            referrerPolicy="no-referrer"
            id="iptv-secure-iframe"
            title="IPTV Secure Stream Player"
          />
        )}
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center z-40 space-y-4"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-violet-500/10 border-t-2 border-t-violet-500 animate-spin" />
              <Tv className="w-6 h-6 text-violet-400 absolute inset-0 m-auto animate-pulse" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-bold text-white tracking-wide">CONNEXION AU FLUX SÉCURISÉ</p>
              <p className="text-xs text-slate-500 font-mono">Chiffrement actif • Proxy-Pass activé</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Header Controls Overlay - Slides down on hover/move */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent z-30 flex items-center justify-between pointer-events-auto"
          >
            {/* Left controller: back button & status */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleClosePlayer}
                className="p-2.5 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl border border-slate-700/50 transition-all flex items-center gap-2 cursor-pointer text-xs font-bold shadow-lg shadow-black/40 hover:scale-105 active:scale-95"
                title="Retourner au portail"
                id="player-back-btn"
              >
                <ChevronLeft className="w-4.5 h-4.5 text-violet-400" />
                <span>Retour</span>
              </button>

              <div className="flex flex-col">
                <span className="text-white font-black text-xs md:text-sm flex items-center gap-2 tracking-wider">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse border border-emerald-400 shrink-0" />
                  LECTURE DIRECTE SÉCURISÉE
                </span>
                <span className="text-[9px] md:text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
                  Flux Interne • Masquage Actif d'URL (huhu.to masqué)
                </span>
              </div>
            </div>

            {/* Right controller: quick action widgets & fullscreen toggle */}
            <div className="flex items-center gap-3">
              {/* Real-time countdown subscription time pill */}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono text-[10px] shadow-lg transition-all ${
                timeRemaining <= 300000 
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse" 
                  : "bg-slate-900/85 border-slate-800 text-slate-300"
              }`}>
                <Clock className={`w-3.5 h-3.5 ${timeRemaining <= 300000 ? "text-rose-500 animate-spin" : "text-violet-400"}`} />
                <span className="font-semibold uppercase text-[9px] text-slate-400">Expiration :</span>
                <span className={timeRemaining <= 300000 ? "font-bold text-rose-400 animate-pulse" : "font-semibold text-emerald-400"}>
                  {formatTimeRemaining(timeRemaining)}
                </span>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/85 rounded-xl border border-slate-800 text-slate-300 font-mono text-[10px] shadow-lg">
                <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="font-bold">4K UHD PROJECTION</span>
              </div>

              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/85 rounded-xl border border-slate-800 text-slate-300 font-mono text-[10px] shadow-lg">
                <Clock className="w-3.5 h-3.5 text-violet-400" />
                <span>{currentTime.toLocaleTimeString("fr-FR")}</span>
              </div>

              {/* Real Fullscreen Button */}
              <button
                onClick={toggleFullScreen}
                className="p-2.5 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl border border-slate-700/50 transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
                title={isFullScreen ? "Quitter le plein écran" : "Plein écran système"}
                id="player-fullscreen-btn"
              >
                {isFullScreen ? (
                  <Minimize className="w-4.5 h-4.5 text-violet-400" />
                ) : (
                  <Maximize className="w-4.5 h-4.5 text-violet-400" />
                )}
              </button>

              {/* Close Button */}
              <button
                onClick={handleClosePlayer}
                className="p-2.5 bg-rose-600/90 hover:bg-rose-500 text-white rounded-xl font-bold transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
                title="Quitter le lecteur"
                id="player-close-btn"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent Pre-Expiration Alert (5 minutes remaining warning toast) */}
      <AnimatePresence>
        {showWarningToast && timeRemaining > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -50, x: "-50%" }}
            className="absolute top-18 left-1/2 transform -translate-x-1/2 z-50 p-4 bg-slate-950/95 border border-rose-500/30 rounded-2xl shadow-2xl flex items-start gap-3 text-slate-200 text-xs font-medium max-w-sm backdrop-blur-md"
            id="session-expiration-warning-toast"
          >
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 animate-bounce" />
            <div className="space-y-1">
              <span className="font-bold text-white block">Attention : Session expirant bientôt !</span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Votre abonnement expire dans <span className="font-mono text-rose-400 font-bold">{formatTimeRemaining(timeRemaining)}</span>. Vous serez automatiquement déconnecté pour des raisons de sécurité.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toast indicating controls exist */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-1.5 bg-slate-950/90 border border-slate-850 rounded-full text-[10px] text-slate-400 font-mono tracking-wide z-30 pointer-events-none flex items-center gap-2 shadow-2xl backdrop-blur-md"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-ping" />
            Bougez la souris pour afficher les options de contrôle
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
