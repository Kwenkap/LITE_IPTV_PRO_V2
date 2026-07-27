import React, { useState, useEffect } from "react";
import { useLanguage } from "../lib/i18n";
import { isLowPowerDevice } from "../lib/device";

// Lightweight, compressed posters for fast loading
const POSTER_IMAGES = [
  "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=250&q=60",
  "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=250&q=60",
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=250&q=60",
  "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=250&q=60",
  "https://images.unsplash.com/photo-1574375927938-d5a98e8edd86?auto=format&fit=crop&w=250&q=60",
  "https://images.unsplash.com/photo-1518063319789-7217e6706b04?auto=format&fit=crop&w=250&q=60",
];

export default function AnimatedPosterWall() {
  const { theme } = useLanguage();
  const [isLowPower, setIsLowPower] = useState(false);

  useEffect(() => {
    setIsLowPower(isLowPowerDevice());
  }, []);

  // For Smart TV or low power devices: render a completely static, 0-CPU-usage background
  if (isLowPower) {
    return (
      <div 
        className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0 select-none bg-[#090d16]" 
        id="animated-poster-wall-bg"
      >
        <div className={`absolute inset-0 bg-gradient-to-tr ${
          theme === "dark" 
            ? "from-[#0a0d16] via-[#0d1222] to-[#141b2d]" 
            : "from-[#fbfaf6] via-[#f4f0e6] to-[#eae3d2]"
        }`} />
      </div>
    );
  }

  // Pure GPU-accelerated CSS animation for modern desktops/mobile
  return (
    <div 
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0 select-none" 
      id="animated-poster-wall-bg"
    >
      {/* CSS Keyframe Animation Injected */}
      <style>{`
        @keyframes scrollColumnUp {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(0, -50%, 0); }
        }
        @keyframes scrollColumnDown {
          0% { transform: translate3d(0, -50%, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        .animate-scroll-up {
          animation: scrollColumnUp 45s linear infinite;
          will-change: transform;
        }
        .animate-scroll-down {
          animation: scrollColumnDown 55s linear infinite;
          will-change: transform;
        }
      `}</style>

      {/* Tilted Poster Grid */}
      <div className={`absolute inset-0 w-full h-full origin-center rotate-[4deg] scale-[1.08] ${theme === "dark" ? "opacity-20" : "opacity-10"}`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full h-full max-w-7xl mx-auto px-4 overflow-hidden">
          
          {/* Column 1 */}
          <div className="flex flex-col gap-4 animate-scroll-up">
            {[...POSTER_IMAGES, ...POSTER_IMAGES].map((src, i) => (
              <div key={i} className="aspect-[2/3] w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                <img src={src} alt="" className="w-full h-full object-cover opacity-70" loading="lazy" referrerPolicy="no-referrer" />
              </div>
            ))}
          </div>

          {/* Column 2 */}
          <div className="flex flex-col gap-4 animate-scroll-down">
            {[...POSTER_IMAGES, ...POSTER_IMAGES].reverse().map((src, i) => (
              <div key={i} className="aspect-[2/3] w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                <img src={src} alt="" className="w-full h-full object-cover opacity-70" loading="lazy" referrerPolicy="no-referrer" />
              </div>
            ))}
          </div>

          {/* Column 3 (Hidden on mobile) */}
          <div className="hidden md:flex flex-col gap-4 animate-scroll-up">
            {[...POSTER_IMAGES, ...POSTER_IMAGES].map((src, i) => (
              <div key={i} className="aspect-[2/3] w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                <img src={src} alt="" className="w-full h-full object-cover opacity-70" loading="lazy" referrerPolicy="no-referrer" />
              </div>
            ))}
          </div>

          {/* Column 4 (Hidden on mobile) */}
          <div className="hidden md:flex flex-col gap-4 animate-scroll-down">
            {[...POSTER_IMAGES, ...POSTER_IMAGES].reverse().map((src, i) => (
              <div key={i} className="aspect-[2/3] w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                <img src={src} alt="" className="w-full h-full object-cover opacity-70" loading="lazy" referrerPolicy="no-referrer" />
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Lightweight Gradient Overlay (No heavy backdrop-blur) */}
      <div className={`absolute inset-0 ${
        theme === "dark"
          ? "bg-gradient-to-b from-[#0a0d16] via-[#0a0d16]/95 to-[#0a0d16]"
          : "bg-gradient-to-b from-[#fbfaf6] via-[#fbfaf6]/95 to-[#fbfaf6]"
      } z-10`} />
    </div>
  );
}


