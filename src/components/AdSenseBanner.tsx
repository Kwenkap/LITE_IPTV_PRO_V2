import React, { useEffect, useRef, useState } from "react";

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
  style = {},
  label = "Publicité"
}: AdSenseBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  const initializedRef = useRef<boolean>(false);
  const [adStatus, setAdStatus] = useState<"loading" | "filled" | "unfilled">("loading");

  useEffect(() => {
    // Si l'élément a déjà été poussé dans adsbygoogle, ne pas le repousser
    if (initializedRef.current) return;

    let isMounted = true;
    
    // Léger délai pour s'assurer que le DOM et les styles sont calculés
    const timer = setTimeout(() => {
      if (!isMounted || !adRef.current) return;

      try {
        const insElement = adRef.current;
        // Vérifier si AdSense a déjà marqué cet élément
        const status = insElement.getAttribute("data-adsbygoogle-status");
        if (!status) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          initializedRef.current = true;
        }

        // Observer les attributs ajoutés par Google AdSense (ex: data-ad-status="filled" ou "unfilled")
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === "attributes" && mutation.attributeName === "data-ad-status") {
              const currentStatus = insElement.getAttribute("data-ad-status");
              if (currentStatus === "filled") {
                setAdStatus("filled");
              } else if (currentStatus === "unfilled") {
                setAdStatus("unfilled");
              }
            }
          });
        });

        observer.observe(insElement, { attributes: true });

        return () => observer.disconnect();
      } catch (err) {
        console.warn("Google AdSense push warning:", err);
      }
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [slot]);

  return (
    <div className={`w-full my-6 flex flex-col items-center justify-center overflow-hidden ${className}`}>
      {label && (
        <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase mb-1.5 select-none">
          — {label} —
        </span>
      )}
      <div className="w-full max-w-5xl flex justify-center bg-slate-900/30 border border-slate-800/40 rounded-xl p-2 min-h-[90px] relative">
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: "block", width: "100%", textAlign: "center", ...style }}
          data-ad-client={client}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive={responsive ? "true" : "false"}
        />
      </div>
    </div>
  );
}
