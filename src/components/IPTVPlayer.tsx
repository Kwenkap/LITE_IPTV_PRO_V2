import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Tv, Maximize, Minimize, Clock, X, AlertTriangle
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
    }, 4000);

    return () => clearInterval(checkInterval);
  }, [username, expiresAt, onSessionExpired]);

  // Update timeRemaining every second
  useEffect(() => {
    const interval = setInterval(() => {
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

  const handleClosePlayer = useCallback(async () => {
    try {
      // Exit fullscreen first if active
      if (document.fullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen().catch(() => {});
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        }
      }

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
  }, [username, onClose]);

  // Handle heartbeat for device limits
  useEffect(() => {
    if (!username) return;

    const deviceId = localStorage.getItem("iptv_device_id");
    
    const sendHeartbeat = async () => {
      try {
        const response = await fetch("/api/session/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, deviceId }),
        });
        
        if (!response.ok) {
          if (onSessionExpired) {
            onSessionExpired();
          } else {
            onClose();
          }
        }
      } catch (e) {
        console.warn("Heartbeat failed", e);
      }
    };

    sendHeartbeat();
    const heartbeatInterval = setInterval(sendHeartbeat, 30000);

    return () => clearInterval(heartbeatInterval);
  }, [username, onClose, onSessionExpired]);

  // Handle stream load simulation
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [url]);

  // Autohide controls on idle
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  useEffect(() => {
    handleMouseMove();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [handleMouseMove]);

  // Toggle full browser screen (HTML5 Fullscreen API with mobile landscape orientation support)
  const toggleFullScreen = useCallback(async () => {
    const el = containerRef.current || document.documentElement;
    
    if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
      try {
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        } else if ((el as any).webkitRequestFullscreen) {
          await (el as any).webkitRequestFullscreen();
        }
        setIsFullScreen(true);

        // Mobile orientation lock: switch to landscape when entering fullscreen on supported mobile devices
        if (typeof window !== "undefined" && window.screen?.orientation && "lock" in window.screen.orientation) {
          try {
            await (window.screen.orientation as any).lock("landscape").catch(() => {});
          } catch (_) {}
        }
      } catch (err) {
        console.error("Error entering fullscreen:", err);
      }
    } else {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
        setIsFullScreen(false);

        // Unlock orientation on exit
        if (typeof window !== "undefined" && window.screen?.orientation && "unlock" in window.screen.orientation) {
          try {
            (window.screen.orientation as any).unlock();
          } catch (_) {}
        }
      } catch (err) {
        console.error("Error exiting fullscreen:", err);
      }
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullScreen(!!(document.fullscreenElement || (document as any).webkitFullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
    };
  }, []);

  // Keyboard navigation shortcuts: Escape to exit fullscreen or player, F for fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === "Escape") {
        if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
          // Native browser will exit fullscreen, update state
          if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          } else if ((document as any).webkitExitFullscreen) {
            (document as any).webkitExitFullscreen();
          }
        } else {
          // If not in fullscreen, pressing Escape exits the player
          handleClosePlayer();
        }
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullScreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClosePlayer, toggleFullScreen]);

  const isDirectVideo = url.endsWith(".m3u8") || url.endsWith(".mp4") || url.endsWith(".webm") || url.endsWith(".ogg");

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onClick={handleMouseMove}
      className="fixed inset-0 w-screen h-screen bg-black z-[9999] overflow-hidden flex flex-col justify-center items-center select-none m-0 p-0"
      id="iptv-immersive-fullscreen-player"
    >
      {/* Stream Player Area (Full window, zero margins, 100% free top area for site navigation) */}
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

      {/* DISCREET FLOATING CONTROLS IN BOTTOM-RIGHT CORNER (Zero top obstruction, free navigation) */}
      <div 
        className="fixed bottom-4 right-4 z-50 pointer-events-auto flex items-center select-none"
        id="iptv-player-floating-controls"
      >
        <AnimatePresence mode="wait">
          {showControls ? (
            /* Expanded Quick Pill when moving mouse or tapping */
            <motion.div
              key="player-expanded-controls"
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-2 p-1.5 rounded-full bg-black/85 backdrop-blur-xl border border-white/20 shadow-2xl shadow-black"
            >
              {/* Expiration Countdown badge */}
              <div 
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-mono text-[11px] backdrop-blur-md ${
                  timeRemaining <= 300000 
                    ? "bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse" 
                    : "bg-slate-900/90 border-slate-800 text-slate-300"
                }`}
                title="Temps restant sur votre session"
              >
                <Clock className={`w-3.5 h-3.5 ${timeRemaining <= 300000 ? "text-rose-400 animate-spin" : "text-violet-400"}`} />
                <span className={timeRemaining <= 300000 ? "font-bold text-rose-300" : "text-emerald-400 font-medium"}>
                  {formatTimeRemaining(timeRemaining)}
                </span>
              </div>

              {/* Fullscreen Button */}
              <button
                type="button"
                onClick={toggleFullScreen}
                className={`min-h-[40px] px-3.5 rounded-full flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 shadow-md cursor-pointer ${
                  isFullScreen
                    ? "bg-violet-600 text-white border border-violet-400/40 hover:bg-violet-500"
                    : "bg-slate-800 text-white border border-slate-700 hover:bg-slate-700"
                }`}
                title={isFullScreen ? "Quitter le plein écran (F)" : "Activer le mode plein écran (F)"}
                id="player-fullscreen-btn"
              >
                {isFullScreen ? (
                  <>
                    <Minimize className="w-4 h-4 text-violet-200" />
                    <span>Réduire</span>
                  </>
                ) : (
                  <>
                    <Maximize className="w-4 h-4 text-amber-400" />
                    <span>Plein écran</span>
                  </>
                )}
              </button>

              {/* Quick Close / Exit Button */}
              <button
                type="button"
                onClick={handleClosePlayer}
                className="min-h-[40px] px-3.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 text-xs font-bold shadow-md active:scale-95 transition-all cursor-pointer"
                title="Quitter le lecteur et revenir au portail (Échap)"
                id="player-close-btn"
              >
                <X className="w-4 h-4" />
                <span>Quitter</span>
              </button>
            </motion.div>
          ) : (
            /* Ultra-Compact Floating Mini-Icon Pill during idle playback */
            <motion.div
              key="player-compact-fab"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.45, scale: 1 }}
              whileHover={{ opacity: 1, scale: 1.05 }}
              whileTap={{ opacity: 1, scale: 0.95 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-1.5 p-1 rounded-full bg-black/70 backdrop-blur-md border border-white/20 shadow-xl"
            >
              <button
                type="button"
                onClick={toggleFullScreen}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  isFullScreen ? "text-violet-300" : "text-amber-400"
                }`}
                title={isFullScreen ? "Sortir du plein écran (F)" : "Plein écran (F)"}
                aria-label={isFullScreen ? "Sortir du plein écran" : "Plein écran"}
              >
                {isFullScreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={handleClosePlayer}
                className="w-10 h-10 rounded-full flex items-center justify-center text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                title="Quitter le lecteur (Échap)"
                aria-label="Quitter le lecteur"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Persistent Pre-Expiration Alert at Bottom Center (5 minutes remaining warning toast, does not block top) */}
      <AnimatePresence>
        {showWarningToast && timeRemaining > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 30, x: "-50%" }}
            className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 p-3 bg-slate-950/95 border border-rose-500/30 rounded-xl shadow-2xl flex items-start gap-2.5 text-slate-200 text-xs font-medium max-w-sm backdrop-blur-md"
            id="session-expiration-warning-toast"
          >
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5 animate-bounce" />
            <div className="space-y-0.5">
              <span className="font-bold text-white block text-xs">Attention : Expiration proche</span>
              <p className="text-slate-300 text-[11px]">
                Votre abonnement expire dans <span className="font-mono text-rose-400 font-bold">{formatTimeRemaining(timeRemaining)}</span>.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
