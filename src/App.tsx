import React, { useState, useEffect } from "react";
import IPTVLogin from "./components/IPTVLogin";
import IPTVAdmin from "./components/IPTVAdmin";
import IPTVPlayer from "./components/IPTVPlayer";
import DigitalStore from "./components/DigitalStore";
import AnimatedPosterWall from "./components/AnimatedPosterWall";
import HelpFloatingButton from "./components/HelpFloatingButton";
import ThemeLanguageControls from "./components/ThemeLanguageControls";
import SEO from "./components/SEO";
import InstallPWA from "./components/InstallPWA";
import { Shield, Tv, Sparkles, Server } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "./lib/i18n";

export default function App() {
  const { t, theme } = useLanguage();
  const [currentPath, setCurrentPath] = useState(() => {
    return window.location.pathname;
  });
  const [activeStreamUrl, setActiveStreamUrl] = useState<string | null>(null);
  const [activeStreamUsername, setActiveStreamUsername] = useState<string>("");
  const [activeStreamExpiresAt, setActiveStreamExpiresAt] = useState<number>(0);
  const [loginError, setLoginError] = useState<string>("");

  // Watch for history state changes or manual page changes
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
  };

  const handleSessionExpired = () => {
    setActiveStreamUrl(null);
    setActiveStreamUsername("");
    setActiveStreamExpiresAt(0);
    setLoginError("Votre session a expiré ou le compte a été désactivé.");
    navigateTo("/iptv");
  };

  const isAdminPage = currentPath.includes("/admin");
  const isStorePage = currentPath.includes("/store");

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://poweriptvv2.netlify.app";

  let seoConfig = {
    title: "POWER IPTV - Abonnements IPTV Premium 4K, Web Player & Streaming TV",
    description: "Découvrez Power IPTV : Le leader de l'abonnement IPTV Premium 4K & FHD. Accédez à plus de 20 000 chaînes TV en direct, films et séries VOD sans coupure sur Smart TV, Android et PC.",
    keywords: "Power IPTV, Power IPTV abonnement, Power IPTV player, IPTV Premium France, abonnement IPTV 4K, IPTV smart tv, web player IPTV",
    canonicalUrl: `${baseUrl}${currentPath}`
  };

  if (isStorePage) {
    seoConfig = {
      title: "Abonnement Power IPTV - Boutique Officielle & Tarifs IPTV Premium 4K",
      description: "Achetez votre abonnement Power IPTV Premium 1, 3, 6 ou 12 Mois. Plus de 20 000 chaînes 4K Ultra HD & 60 000 VODs. Livraison instantanée et paiement sécurisé.",
      keywords: "Abonnement Power IPTV, prix Power IPTV, acheter abonnement IPTV, Power IPTV 12 mois, IPTV Premium tarif, IPTV 4k france",
      canonicalUrl: `${baseUrl}/store`
    };
  } else if (isAdminPage) {
    seoConfig = {
      title: "Espace d'Administration - Power IPTV Management",
      description: "Espace sécurisé de gestion du serveur et des abonnements Power IPTV.",
      keywords: "Power IPTV admin, gestion serveur IPTV",
      canonicalUrl: `${baseUrl}/iptv/admin`
    };
  } else if (activeStreamUrl) {
    seoConfig = {
      title: "Lecteur Web Player Power IPTV 4K - Streaming en Direct",
      description: "Regardez vos chaînes de télévision et films VOD en direct avec le Web Player Power IPTV haute fidélité.",
      keywords: "Power IPTV player, web player iptv, streaming live iptv",
      canonicalUrl: `${baseUrl}/iptv`
    };
  }

  return (
    <div 
      className={`min-h-screen flex flex-col relative overflow-x-hidden transition-colors duration-300 ${
        theme === "dark" 
          ? "bg-[#0a0d16] text-slate-100 selection:bg-amber-500/30 selection:text-white" 
          : "bg-[#fbfaf6] text-slate-900 selection:bg-amber-300 selection:text-slate-900"
      }`} 
      id="main-app-container"
    >
      <SEO {...seoConfig} />
      <InstallPWA />
      {/* Top Header Bar for Language Selector and Light/Dark Mode Switcher */}
      {!activeStreamUrl && (
        <header className="w-full relative z-50 pointer-events-auto px-4 py-3 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateTo("/iptv")}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-violet-500 to-amber-400 p-[1.5px] shadow-md shadow-amber-500/10">
              <div className={`w-full h-full rounded-[10.5px] flex items-center justify-center ${theme === "dark" ? "bg-[#0d111d]" : "bg-white"}`}>
                <Tv className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <span className={`text-base font-extrabold tracking-tight font-display ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
              POWER<span className="text-amber-400">IPTV</span>
            </span>
          </div>

          <ThemeLanguageControls />
        </header>
      )}

      {/* Immersive Cinematic Scrolling Poster Background for the Home Page */}
      {!isAdminPage && !isStorePage && !activeStreamUrl && <AnimatedPosterWall />}

      {/* Decorative Warm Background Glow Nodes (Zero performance overhead CSS radial gradients) */}
      <div 
        className={`absolute inset-0 w-full h-full pointer-events-none z-0 ${
          theme === "dark"
            ? "bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-amber-950/20 via-transparent to-transparent"
            : "bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-amber-200/30 via-transparent to-transparent"
        }`} 
      />

      {/* Main Core Content wrapper */}
      <main className="flex-1 flex flex-col items-center justify-center py-6 px-4 relative z-10 w-full">
        
        {/* Header Title with animated glowing logo */}
        {!activeStreamUrl && (
          <div className="text-center mb-8 pointer-events-auto">
            {isAdminPage ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => navigateTo("/iptv")}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 backdrop-blur-md mb-4 text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-red-400" />
                <span className="font-mono text-[10px] tracking-wider uppercase">
                  {t("back_to_portal")}
                </span>
                <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
              </motion.div>
            ) : !isStorePage ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full backdrop-blur-md mb-4 text-xs ${
                  theme === "dark" 
                    ? "bg-slate-900/80 border border-amber-500/20 text-amber-300 shadow-sm shadow-amber-950/20" 
                    : "bg-amber-50 border border-amber-300/80 text-amber-900 shadow-sm"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                <span className="font-mono text-[10px] tracking-wider uppercase font-bold">
                  {t("quality_badge")}
                </span>
              </motion.div>
            ) : null}

            {!isStorePage && !isAdminPage && (
              <>
                <motion.h1 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
                  className="text-3xl md:text-4xl font-extrabold tracking-tight font-display flex items-center justify-center gap-3"
                >
                  <Tv className="w-8 h-8 text-amber-500 shrink-0" />
                  <span className={theme === "dark" ? "bg-gradient-to-r from-white via-amber-100 to-amber-300 bg-clip-text text-transparent" : "text-slate-900"}>
                    POWER IPTV
                  </span>
                  <span className="text-xs font-mono font-bold tracking-normal text-amber-500 border border-amber-500/40 px-2.5 py-0.5 rounded-full bg-amber-500/10 self-center shadow-sm">
                    ULTRA HD
                  </span>
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                  className={`text-sm mt-2.5 max-w-md mx-auto ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}
                >
                  {t("tagline")}
                </motion.p>
              </>
            )}
          </div>
        )}

        {/* Dynamic conditional render based on path with smooth fade-in transitions */}
        <div className="w-full flex justify-center">
          <AnimatePresence mode="wait">
            {activeStreamUrl ? (
              <motion.div
                key="player"
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="w-full flex justify-center"
              >
                <IPTVPlayer 
                  url={activeStreamUrl} 
                  username={activeStreamUsername}
                  expiresAt={activeStreamExpiresAt}
                  onClose={() => {
                    setActiveStreamUrl(null);
                    setActiveStreamUsername("");
                    setActiveStreamExpiresAt(0);
                  }} 
                  onSessionExpired={handleSessionExpired}
                />
              </motion.div>
            ) : isStorePage ? (
              <motion.div
                key="store"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="w-full flex justify-center"
              >
                <DigitalStore 
                  onNavigateToIPTV={() => navigateTo("/iptv")}
                  onNavigateToAdmin={() => navigateTo("/iptv/admin")} 
                />
              </motion.div>
            ) : isAdminPage ? (
              <motion.div
                key="admin"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="w-full flex justify-center"
              >
                <IPTVAdmin onNavigateToLogin={() => navigateTo("/iptv")} />
              </motion.div>
            ) : (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="w-full flex justify-center"
              >
                <IPTVLogin 
                  onNavigateToAdmin={() => navigateTo("/iptv/admin")} 
                  onNavigateToStore={() => navigateTo("/store")}
                  onPlayStream={(url, username, expiresAt) => {
                    setLoginError(""); // clear any prior errors
                    setActiveStreamUrl(url);
                    setActiveStreamUsername(username);
                    setActiveStreamExpiresAt(expiresAt);
                  }} 
                  initialError={loginError}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </main>

      {/* Floating Support Button */}
      {!isAdminPage && !activeStreamUrl && <HelpFloatingButton />}

      {/* Footer copyright and diagnostics */}
      <footer 
        className={`py-6 border-t relative z-10 text-center text-xs backdrop-blur-md transition-colors ${
          theme === "dark"
            ? "border-slate-800/80 bg-[#070a12]/80 text-slate-400"
            : "border-slate-200 bg-white/80 text-slate-600"
        }`} 
        id="main-footer"
      >
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <Server className="w-3.5 h-3.5 text-amber-500" />
            <span>{t("gateway_proxy")}</span>
            <span className="text-emerald-500 font-semibold">{t("server_active")}</span>
          </div>
          <div>
            &copy; {new Date().getFullYear()} {t("copyright")}
          </div>
          <div className="flex items-center gap-3 font-mono text-[10px] text-slate-500">
            <span>PROD • CLOUD_RUN</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

