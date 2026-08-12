import React, { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

interface AdSenseBannerProps {
  client?: string;
  slot?: string;
  format?: "auto" | "fluid" | "rectangle" | "horizontal";
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
  label?: string;
}

export default function AdSenseBanner({
  client = "ca-pub-4343998384590985",
  slot = "5222416367", // Slot publicitaire: pub perso 1
  format = "auto",
  responsive = true,
  className = "",
  style = { display: "block" },
  label = "Publicité"
}: AdSenseBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  const pushedRef = useRef<boolean>(false);

  useEffect(() => {
    // Éviter les doubles appels push({}) sur le même composant
    if (pushedRef.current) return;

    const timer = setTimeout(() => {
      try {
        if (typeof window !== "undefined" && adRef.current) {
          // Vérifier si l'élément ins n'a pas déjà été rempli par AdSense
          if (!adRef.current.getAttribute("data-adsbygoogle-status")) {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            pushedRef.current = true;
          }
        }
      } catch (err) {
        console.warn("Google AdSense push error:", err);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`w-full my-6 flex flex-col items-center justify-center overflow-hidden ${className}`}>
      {label && (
        <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase mb-1.5 select-none">
          — {label} —
        </span>
      )}
      <div className="w-full max-w-5xl flex justify-center bg-slate-900/40 border border-slate-800/50 rounded-xl p-2 min-h-[90px]">
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={style}
          data-ad-client={client}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive={responsive ? "true" : "false"}
        />
      </div>
    </div>
  );
}
