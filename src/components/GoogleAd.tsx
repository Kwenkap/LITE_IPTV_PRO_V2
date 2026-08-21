import React, { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

export interface GoogleAdProps {
  client?: string;
  slot?: string;
  format?: "auto" | "fluid" | "rectangle" | "horizontal" | "vertical";
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
  label?: string;
  minHeight?: number | string;
  fallbackText?: string;
  debug?: boolean;
}

export default function GoogleAd({
  client = "ca-pub-4343998384590985",
  slot = "5222416367",
  format = "auto",
  responsive = true,
  className = "",
  style = {},
  label = "Espace Publicitaire",
  minHeight = 90,
  fallbackText = "Chargement de l'annonce...",
  debug = true
}: GoogleAdProps) {
  const adRef = useRef<HTMLModElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef<boolean>(false);
  const [adStatus, setAdStatus] = useState<"loading" | "filled" | "unfilled" | "blocked">("loading");
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const addLog = (msg: string) => {
    if (debug) {
      console.log(`[GoogleAd][Slot ${slot}] ${msg}`);
      setDebugLog(prev => [...prev.slice(-4), msg]);
    }
  };

  useEffect(() => {
    // Only initialize once on mount
    if (initializedRef.current) return;

    let isMounted = true;
    const isDevEnv = 
      typeof window !== "undefined" && 
      (window.location.hostname.includes("localhost") || 
       window.location.hostname.includes("ais-dev") || 
       window.location.hostname.includes("127.0.0.1"));

    addLog(`Mounting GoogleAd. Host: ${window.location.hostname}, Dev: ${isDevEnv}`);

    // Check script availability
    const scriptLoaded = typeof window !== "undefined" && Array.isArray(window.adsbygoogle);
    if (!scriptLoaded && typeof window !== "undefined" && !window.adsbygoogle) {
      addLog("window.adsbygoogle is not defined yet. Waiting for script to load...");
    }

    const timer = setTimeout(() => {
      if (!isMounted || !adRef.current) return;

      try {
        const insElement = adRef.current;
        const currentStatus = insElement.getAttribute("data-adsbygoogle-status");

        if (typeof window === "undefined" || !window.adsbygoogle) {
          addLog("WARNING: AdSense script failed to load or is blocked by an ad-blocker.");
          setAdStatus("blocked");
        } else if (!currentStatus) {
          addLog("Initializing adsbygoogle.push({})...");
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          initializedRef.current = true;
          addLog("adsbygoogle.push() executed successfully.");
        } else {
          addLog(`Already processed by AdSense with status: ${currentStatus}`);
        }

        // Setup MutationObserver to watch Google's fill status
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === "attributes" && mutation.attributeName === "data-ad-status") {
              const status = insElement.getAttribute("data-ad-status");
              addLog(`Ad status updated by Google: ${status}`);
              if (status === "filled") {
                setAdStatus("filled");
              } else if (status === "unfilled") {
                setAdStatus("unfilled");
                addLog("Google returned 'unfilled' (no ad matching targeting or unpaid account setup).");
              }
            }
          });
        });

        observer.observe(insElement, { attributes: true });

        return () => {
          observer.disconnect();
        };
      } catch (err: any) {
        addLog(`Error during push: ${err?.message || err}`);
        console.warn("[GoogleAd Error]", err);
      }
    }, 120);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [slot, client]);

  const minH = typeof minHeight === "number" ? `${minHeight}px` : minHeight;

  return (
    <div 
      ref={containerRef}
      className={`w-full my-4 flex flex-col items-center justify-center overflow-hidden ${className}`}
      id={`google-ad-wrapper-${slot}`}
    >
      {label && (
        <div className="flex items-center gap-2 mb-1.5 select-none">
          <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
            — {label} —
          </span>
          {debug && process.env.NODE_ENV !== "production" && (
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
              adStatus === "filled" ? "bg-emerald-500/20 text-emerald-400" :
              adStatus === "unfilled" ? "bg-amber-500/20 text-amber-400" :
              adStatus === "blocked" ? "bg-red-500/20 text-red-400" :
              "bg-slate-800 text-slate-400"
            }`}>
              status: {adStatus}
            </span>
          )}
        </div>
      )}

      {/* Main Container with fallback & CLS prevention wrapper */}
      <div 
        className="w-full max-w-5xl relative rounded-xl border border-slate-800/40 bg-slate-900/30 overflow-hidden flex items-center justify-center transition-all duration-300"
        style={{ minHeight: minH }}
      >
        {/* Fallback skeleton layer to prevent layout shift while loading */}
        {adStatus === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-slate-900/20 pointer-events-none z-0">
            <div className="w-1/3 h-2.5 bg-slate-800/60 rounded-full animate-pulse mb-2" />
            <span className="text-[11px] text-slate-500 font-mono">
              {fallbackText}
            </span>
          </div>
        )}

        {/* Fallback for blocked state (e.g. adblocker detected) */}
        {adStatus === "blocked" && (
          <div className="absolute inset-0 flex items-center justify-center p-3 text-center bg-slate-900/40 text-[11px] text-slate-500">
            <span>Annonce désactivée ou bloqueur de publicité actif</span>
          </div>
        )}

        {/* The Google AdSense Ins Element */}
        <ins
          ref={adRef}
          className="adsbygoogle relative z-10 w-full"
          style={{
            display: "block",
            width: "100%",
            textAlign: "center",
            minHeight: minH,
            ...style
          }}
          data-ad-client={client}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive={responsive ? "true" : "false"}
        />
      </div>
    </div>
  );
}
