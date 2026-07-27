import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Tv2, Lock, User, AlertTriangle, RefreshCw, Play, 
  ShoppingCart, Sparkles, ArrowRight, ShieldCheck, Compass 
} from "lucide-react";
import FAQSection from "./FAQSection";
import SEOContentSection from "./SEOContentSection";
import { useLanguage } from "../lib/i18n";

// Simple robust obfuscation/encryption for local storage
export function encryptCredentials(text: string): string {
  if (!text) return "";
  const shifted = text.split("").map(c => String.fromCharCode(c.charCodeAt(0) + 3)).join("");
  return btoa(encodeURIComponent(shifted));
}

export function decryptCredentials(cipher: string): string {
  if (!cipher) return "";
  try {
    const raw = decodeURIComponent(atob(cipher));
    return raw.split("").map(c => String.fromCharCode(c.charCodeAt(0) - 3)).join("");
  } catch (e) {
    return "";
  }
}

interface IPTVLoginProps {
  onNavigateToAdmin: () => void;
  onNavigateToStore?: () => void;
  onPlayStream: (url: string, username: string, expiresAt: number) => void;
  initialError?: string;
}

export default function IPTVLogin({ onNavigateToAdmin, onNavigateToStore, onPlayStream, initialError }: IPTVLoginProps) {
  const { t, theme } = useLanguage();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isCheckingStoredSession, setIsCheckingStoredSession] = useState(true);
  const [error, setError] = useState(initialError || "");
  const [rememberMe, setRememberMe] = useState(false);
  const [rememberedUser, setRememberedUser] = useState<{ username: string; expiresAt: number } | null>(null);

  // Load remembered credentials on mount with skeleton feedback
  useEffect(() => {
    const timer = setTimeout(() => {
      const stored = localStorage.getItem("iptv_remembered_credentials");
      if (stored) {
        try {
          const { u, p } = JSON.parse(stored);
          const decUsername = decryptCredentials(u);
          const decPassword = decryptCredentials(p);
          if (decUsername && decPassword) {
            setUsername(decUsername);
            setPassword(decPassword);
            setRememberMe(true);

            // Get last session info if matches
            const lastSession = localStorage.getItem("iptv_last_session_info");
            if (lastSession) {
              const parsedSession = JSON.parse(lastSession);
              if (parsedSession.username.toLowerCase() === decUsername.toLowerCase()) {
                setRememberedUser(parsedSession);
              }
            }
          }
        } catch (e) {
          console.error("Erreur lors de la lecture des identifiants mémorisés :", e);
        }
      }
      setIsCheckingStoredSession(false);
    }, 450);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (initialError) {
      setError(initialError);
    }
  }, [initialError]);

  const handleSubmit = async (e?: React.FormEvent, customUser?: string, customPass?: string) => {
    if (e) e.preventDefault();
    
    const loginUser = customUser || username;
    const loginPass = customPass || password;

    if (!loginUser.trim() || !loginPass.trim()) {
      setError(t("password_label") + " / " + t("username_label") + " required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUser, password: loginPass }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue lors de la connexion.");
      }

      if (data.isAdmin) {
        localStorage.setItem("iptv_admin_token", data.adminToken);
        onNavigateToAdmin();
        return;
      }

      // If standard user, handle "Remember Me" options
      if (rememberMe) {
        const credentialsObj = {
          u: encryptCredentials(loginUser),
          p: encryptCredentials(loginPass)
        };
        localStorage.setItem("iptv_remembered_credentials", JSON.stringify(credentialsObj));
        localStorage.setItem("iptv_last_session_info", JSON.stringify({
          username: data.username,
          expiresAt: data.expiresAt
        }));
      } else {
        localStorage.removeItem("iptv_remembered_credentials");
        localStorage.removeItem("iptv_last_session_info");
      }

      // Log the successful connection
      try {
        await fetch("/api/logs/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: data.username,
            event: "login",
            details: "Connexion réussie au lecteur IPTV"
          }),
        });
      } catch (logErr) {
        console.warn("Audit log creation failed:", logErr);
      }

      setIsRedirecting(true);
      setTimeout(() => {
        setIsLoading(false);
        setIsRedirecting(false);
        onPlayStream(data.url, data.username, data.expiresAt);
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Impossible de se connecter au serveur.");
      setIsLoading(false);
    }
  };

  const handleQuickReconnect = () => {
    const stored = localStorage.getItem("iptv_remembered_credentials");
    if (stored) {
      try {
        const { u, p } = JSON.parse(stored);
        const decUsername = decryptCredentials(u);
        const decPassword = decryptCredentials(p);
        if (decUsername && decPassword) {
          handleSubmit(undefined, decUsername, decPassword);
        }
      } catch (e) {
        setError("Impossible de relire les identifiants mémorisés.");
      }
    }
  };

  return (
    <div className="w-full max-w-6xl px-4" id="iptv-login-container">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* BLOCK 1: Connection / Login Form */}
        <div className="order-1 lg:order-2 lg:col-start-8 lg:col-span-5 lg:row-start-1 lg:row-end-3 w-full max-w-md mx-auto">
          
          <div
            className={`relative rounded-2xl p-6 sm:p-8 shadow-2xl overflow-hidden border transition-colors ${
              theme === "dark"
                ? "bg-[#0d121f] border-slate-800 shadow-amber-950/20"
                : "bg-white border-amber-200 shadow-amber-900/10 text-slate-900"
            }`}
            id="login-card"
          >
            {/* Top glowing accent lines */}
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-amber-500 via-violet-500 to-amber-400" />
            
            <div className="text-center mb-8">
              <div className={`inline-flex items-center justify-center p-3 rounded-2xl mb-4 shadow-inner ${
                theme === "dark"
                  ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                  : "bg-amber-100 border border-amber-200 text-amber-800"
              }`}>
                <Tv2 className="w-8 h-8 text-amber-500" />
              </div>
              <h1 className={`text-2xl font-bold tracking-tight mb-2 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                {t("client_portal_title")}
              </h1>
              <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
                {t("client_portal_sub")}
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-500 text-sm"
                id="login-error-alert"
              >
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block mb-0.5">Erreur</span>
                  {error}
                </div>
              </motion.div>
            )}

            {/* SKELETON LOADER FOR REMEMBERED SESSION CHECK */}
            {isCheckingStoredSession ? (
              <div className="mb-5 p-4 rounded-xl border border-amber-500/20 bg-amber-950/10 space-y-3 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                    <div className="h-3.5 w-28 bg-slate-700/80 rounded" />
                  </div>
                  <div className="h-3.5 w-16 bg-slate-700/80 rounded" />
                </div>
                <div className="h-9 w-full bg-amber-500/20 rounded-xl" />
              </div>
            ) : rememberedUser ? (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-5 p-4 rounded-xl border text-xs space-y-3 ${
                  theme === "dark"
                    ? "bg-amber-950/20 border-amber-500/20 text-slate-300"
                    : "bg-amber-50 border-amber-200 text-slate-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-bold font-mono">{rememberedUser.username}</span>
                  </div>
                  <span className="text-[10px] text-amber-500 font-semibold uppercase tracking-wider">
                    {rememberedUser.expiresAt > Date.now() ? "Mémorisé" : "Expiré"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleQuickReconnect}
                  disabled={isLoading || isRedirecting}
                  className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/10 disabled:opacity-50"
                  id="login-quick-reconnect-btn"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  <span>{t("reconnect_button")}</span>
                </button>
              </motion.div>
            ) : null}

            {/* SUBSCRIPTION VERIFICATION SKELETON ON SUBMISSION */}
            {(isLoading || isRedirecting) && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-xl bg-slate-950/90 border border-amber-500/30 space-y-3 mb-5 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    Vérification de l'abonnement IPTV...
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Serveur Sécurisé
                  </span>
                </div>

                {/* Animated Skeleton Info Lines */}
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Authentification:</span>
                    <div className="h-3 w-20 bg-amber-500/20 rounded animate-pulse" />
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Contrôle d'Expiration:</span>
                    <div className="h-3 w-28 bg-slate-800 rounded animate-pulse" />
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Attribution Flux HLS:</span>
                    <div className="h-3 w-24 bg-purple-500/20 rounded animate-pulse" />
                  </div>
                </div>

                {/* Shimmer progress bar */}
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden mt-2 border border-slate-800">
                  <div className="bg-gradient-to-r from-amber-500 via-fuchsia-500 to-cyan-400 h-full w-full animate-pulse" />
                </div>
              </motion.div>
            )}

            <form onSubmit={(e) => handleSubmit(e)} className="space-y-5">
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
                  {t("username_label")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`w-full pl-11 pr-4 py-3 rounded-xl border transition-all text-sm font-mono ${
                      theme === "dark"
                        ? "bg-[#090d16] border-slate-800 text-white placeholder-slate-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:ring-1 focus:ring-amber-500"
                    }`}
                    placeholder={t("username_placeholder")}
                    required
                    disabled={isLoading || isRedirecting}
                    id="login-username-input"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={`block text-xs font-semibold uppercase tracking-wider ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
                    {t("password_label")}
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-11 pr-4 py-3 rounded-xl border transition-all text-sm font-mono ${
                      theme === "dark"
                        ? "bg-[#090d16] border-slate-800 text-white placeholder-slate-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:ring-1 focus:ring-amber-500"
                    }`}
                    placeholder="••••••••••••"
                    required
                    disabled={isLoading || isRedirecting}
                    id="login-password-input"
                  />
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between py-1">
                <label className={`flex items-center gap-2 cursor-pointer select-none text-xs ${theme === "dark" ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-900"}`}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-400 bg-slate-900 text-amber-500 focus:ring-amber-500/50 w-4 h-4 cursor-pointer"
                    id="login-remember-me-checkbox"
                  />
                  <span>{t("remember_me")}</span>
                </label>
              </div>

              <motion.button
                whileHover={{ scale: isRedirecting ? 1 : 1.01 }}
                whileTap={{ scale: isRedirecting ? 1 : 0.99 }}
                type="submit"
                disabled={isLoading || isRedirecting}
                className="relative w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-amber-600 to-violet-600 hover:from-amber-400 hover:to-violet-500 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-amber-500/20 focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50 transition-all overflow-hidden flex items-center justify-center gap-2 cursor-pointer"
                id="login-submit-button"
              >
                {isRedirecting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-slate-950" />
                    <span>{t("launching_stream")}</span>
                  </>
                ) : isLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>{t("authenticating")}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 text-slate-950 fill-slate-950" />
                    <span>{t("connect_button")}</span>
                  </>
                )}
              </motion.button>
            </form>

          </div>

        </div>

        {/* BLOCK 2: Marketplace Special Offer */}
        <div className="order-2 lg:order-1 lg:col-start-1 lg:col-span-7 lg:row-start-1">
          
          <div 
            className={`relative rounded-2xl border p-6 shadow-xl overflow-hidden group ${
              theme === "dark"
                ? "bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border-amber-500/30"
                : "bg-gradient-to-r from-amber-100 via-amber-50 to-white border-amber-300 shadow-amber-100"
            }`}
          >
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-amber-500 via-violet-500 to-amber-400" />
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider">
                  🛒 {t("marketplace_banner_title")}
                </span>
                <h3 className={`text-lg font-bold mt-1 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                  {t("marketplace_banner_title")}
                </h3>
                <p className={`text-xs ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}>
                  {t("marketplace_banner_desc")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (onNavigateToStore) {
                    onNavigateToStore();
                  } else {
                    window.location.href = "/store";
                  }
                }}
                className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 focus:ring-2 focus:ring-amber-400 text-slate-950 text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-500/20"
              >
                <ShoppingCart className="w-4 h-4 text-slate-950" />
                <span>{t("buy_now")}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
              </button>
            </div>
          </div>

        </div>

        {/* BLOCK 3: TV Experience Features & Quality Badges */}
        <div className="order-3 lg:order-1 lg:col-start-1 lg:col-span-7 lg:row-start-2">
          
          <div
            className={`rounded-2xl border p-6 space-y-6 ${
              theme === "dark"
                ? "bg-[#0e1320] border-slate-800"
                : "bg-white border-slate-200 shadow-sm"
            }`}
          >
            <div>
              <h2 className={`text-xl font-bold flex items-center gap-2 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                <Sparkles className="w-5 h-5 text-amber-500" />
                {t("quality_badge")}
              </h2>
              <p className={`text-xs mt-1 ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
                {t("tagline")}
              </p>
            </div>

            {/* TV Channels & VOD preview cards (Vector gradient based - 0ms download time) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Card 1: Live Sports */}
              <div 
                className={`relative rounded-xl overflow-hidden border p-4 h-36 flex flex-col justify-between group cursor-pointer transition-colors ${
                  theme === "dark" 
                    ? "border-rose-500/20 bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-950 hover:border-rose-500/40" 
                    : "border-rose-200 bg-gradient-to-br from-rose-50 via-white to-slate-50 hover:border-rose-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-600 text-white text-[9px] font-extrabold uppercase tracking-widest shadow-md">
                    ⚽ LIVE SPORT
                  </span>
                  <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
                    <Tv2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-white">Canal+, beIN Sports, DAZN, RMC</h4>
                  <p className="text-[10px] text-slate-300">Ligue des Champions, Premier League, F1, UFC.</p>
                </div>
              </div>

              {/* Card 2: Cinema & VOD */}
              <div 
                className={`relative rounded-xl overflow-hidden border p-4 h-36 flex flex-col justify-between group cursor-pointer transition-colors ${
                  theme === "dark" 
                    ? "border-amber-500/20 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 hover:border-amber-500/40" 
                    : "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-slate-50 hover:border-amber-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[9px] font-extrabold uppercase tracking-widest shadow-md">
                    🎬 CINÉMA & VOD
                  </span>
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-white">Netflix, Disney+, Prime, Canal+</h4>
                  <p className="text-[10px] text-slate-300">Derniers blockbusters et séries exclusives.</p>
                </div>
              </div>

            </div>

            {/* Channels Showcase */}
            <div className="space-y-2.5">
              <span className={`text-[10px] font-bold uppercase tracking-wider block ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                Bouquets premium inclus & compatibles
              </span>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-white text-black font-extrabold text-[10px] rounded tracking-tighter border border-slate-200 shadow-sm uppercase flex items-center gap-1 select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                  CANAL+
                </span>
                <span className="px-3 py-1 bg-indigo-950 text-indigo-300 font-extrabold text-[10px] rounded tracking-wide border border-indigo-900 shadow-sm flex items-center gap-1 select-none">
                  beIN SPORTS
                </span>
                <span className="px-3 py-1 bg-zinc-900 text-red-500 font-bold text-[10px] rounded border border-red-900/30 flex items-center gap-1 select-none">
                  <span className="text-slate-400">RMC</span> SPORT
                </span>
                <span className="px-3 py-1 bg-zinc-900 text-amber-400 font-black text-[10px] rounded border border-amber-500/20 flex items-center gap-1 select-none">
                  DAZN
                </span>
                <span className="px-3 py-1 bg-emerald-950/80 text-emerald-400 font-bold text-[10px] rounded border border-emerald-500/20 select-none">
                  TNT FRANCE & INT.
                </span>
              </div>
            </div>

            {/* Key Quality Indicators */}
            <div className={`grid grid-cols-3 gap-3 pt-4 border-t ${theme === "dark" ? "border-slate-800" : "border-slate-200"}`}>
              <div className="text-center space-y-1">
                <div className="text-amber-500 text-sm font-bold flex items-center justify-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>4K UHD</span>
                </div>
                <p className={`text-[9px] ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{t("feature_quality")}</p>
              </div>
              <div className={`text-center space-y-1 border-x ${theme === "dark" ? "border-slate-800" : "border-slate-200"}`}>
                <div className="text-emerald-500 text-sm font-bold flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>99.9%</span>
                </div>
                <p className={`text-[9px] ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{t("feature_stable")}</p>
              </div>
              <div className="text-center space-y-1">
                <div className="text-amber-500 text-sm font-bold flex items-center justify-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-amber-500" />
                  <span>Multi-D.</span>
                </div>
                <p className={`text-[9px] ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{t("feature_secure")}</p>
              </div>
            </div>

          </div>

        </div>

      </div>
      
      <FAQSection />
      <SEOContentSection />
    </div>
  );
}

