import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Globe, Sun, Moon, ChevronDown, Check } from "lucide-react";
import { useLanguage, Language } from "../lib/i18n";

export default function ThemeLanguageControls() {
  const { lang, setLang, theme, setTheme, languages, t } = useLanguage();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLangObj = languages.find(l => l.code === lang) || languages[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-2 relative z-50 pointer-events-auto">
      {/* Theme Switcher Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        title={theme === "dark" ? t("light_mode") : t("dark_mode")}
        className={`p-2 rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-sm ${
          theme === "dark"
            ? "bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/40"
            : "bg-white border border-slate-200 text-amber-600 hover:bg-slate-50 hover:border-slate-300 shadow-slate-200/50"
        }`}
      >
        {theme === "dark" ? (
          <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
        ) : (
          <Moon className="w-4 h-4 text-slate-700" />
        )}
      </motion.button>

      {/* Language Selector Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setIsLangOpen(!isLangOpen)}
          className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-2 text-xs font-semibold cursor-pointer shadow-sm ${
            theme === "dark"
              ? "bg-slate-900/90 border-slate-800 text-slate-200 hover:border-slate-700 hover:text-white"
              : "bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50 shadow-slate-200/50"
          }`}
        >
          <span className="text-sm">{currentLangObj.flag}</span>
          <span className="hidden sm:inline font-mono uppercase text-[11px] font-bold">{currentLangObj.code}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isLangOpen ? "rotate-180" : ""}`} />
        </motion.button>

        <AnimatePresence>
          {isLangOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={`absolute right-0 mt-2 w-44 rounded-2xl border p-1.5 shadow-xl backdrop-blur-2xl z-50 ${
                theme === "dark"
                  ? "bg-[#0d111d]/95 border-amber-500/20 text-slate-200 shadow-amber-950/40"
                  : "bg-white border-slate-200 text-slate-800 shadow-slate-200/80"
              }`}
            >
              <div className={`px-2.5 py-1 text-[10px] font-mono font-bold tracking-wider uppercase border-b mb-1 flex items-center gap-1.5 ${
                theme === "dark" ? "text-amber-500 border-amber-500/10" : "text-slate-500 border-slate-100"
              }`}>
                <Globe className="w-3 h-3 text-amber-500" />
                Langue / Language
              </div>
              {languages.map((l) => {
                const isSelected = l.code === lang;
                return (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLang(l.code);
                      setIsLangOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? theme === "dark"
                          ? "bg-amber-500/20 text-amber-300 font-bold"
                          : "bg-amber-50 text-amber-900 font-bold border border-amber-200/60"
                        : theme === "dark"
                        ? "hover:bg-white/5 text-slate-300 hover:text-white"
                        : "hover:bg-slate-50 text-slate-700 hover:text-slate-900"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm">{l.flag}</span>
                      <span>{l.name}</span>
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-500" />}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
