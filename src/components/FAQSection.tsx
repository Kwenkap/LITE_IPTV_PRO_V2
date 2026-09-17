import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HelpCircle, ChevronDown, Sparkles, Tv, ShieldCheck, Key } from "lucide-react";
import { useLanguage } from "../lib/i18n";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  icon: React.ReactNode;
}

export default function FAQSection() {
  const { theme } = useLanguage();
  const [activeId, setActiveId] = useState<string | null>(null);

  const toggleAccordion = (id: string) => {
    setActiveId(activeId === id ? null : id);
  };

  const faqData: FAQItem[] = [
    {
      id: "activation",
      question: "Comment activer mon abonnement après l'achat ?",
      answer: "Une fois votre abonnement acheté sur notre Marketplace Partenaire, vous recevrez vos identifiants (nom d'utilisateur et mot de passe) par e-mail ou SMS. Saisissez-les simplement dans le formulaire de connexion ci-dessus et cliquez sur 'Lancer mon flux TV' pour lancer instantanément vos chaînes en direct.",
      icon: <Key className="w-4 h-4 text-violet-500" />
    },
    {
      id: "devices",
      question: "Quels appareils et applications sont compatibles ?",
      answer: "POWER IPTV est compatible avec 100% des appareils modernes. Vous pouvez l'utiliser sur Smart TV (Samsung, LG, Android TV), boîtiers IPTV (Formuler, Apple TV, Firestick, MAG), smartphones et tablettes (iOS & Android), ainsi que sur ordinateur. Notre flux s'adapte automatiquement à votre lecteur préféré (Tivimate, IPTV Smarters, VLC, etc.).",
      icon: <Tv className="w-4 h-4 text-fuchsia-500" />
    },
    {
      id: "multi-device",
      question: "Puis-je utiliser mon compte sur plusieurs appareils simultanément ?",
      answer: "Par défaut, un abonnement standard autorise une seule connexion active à la fois pour garantir une fluidité parfaite et éviter les blocages. Si vous tentez de vous connecter sur plusieurs écrans en même temps, le flux risque de saccader. Si vous avez besoin de connexions simultanées pour votre foyer, contactez le support technique.",
      icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />
    },
    {
      id: "troubleshoot",
      question: "Que faire en cas de coupure ou de ralentissement de l'image ?",
      answer: "Nos serveurs premium bénéficient d'une stabilité de 99.9% avec des technologies de flux anti-coupures de pointe. En cas de freeze, nous vous recommandons : 1) De vérifier votre débit Internet (minimum 15-20 Mbps recommandé pour la HD/4K). 2) De redémarrer votre box Internet. 3) De basculer votre lecteur IPTV sur un autre serveur ou format si proposé.",
      icon: <HelpCircle className="w-4 h-4 text-amber-500" />
    }
  ];

  return (
    <section className="w-full mt-12 mb-6" id="faq-section-container" aria-label="Foire aux questions Power IPTV">
      <div className="text-center mb-8">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs mb-3 font-mono font-bold ${
          theme === "dark" 
            ? "bg-violet-500/10 border border-violet-500/20 text-violet-400" 
            : "bg-violet-50 border border-violet-200 text-violet-700"
        }`}>
          <Sparkles className="w-3.5 h-3.5" />
          <span>Foire Aux Questions</span>
        </div>
        <h2 className={`text-xl md:text-2xl font-bold tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
          Questions Fréquentes & Support <span className="text-amber-500 font-extrabold">Power IPTV</span>
        </h2>
        <p className={`text-xs mt-1.5 max-w-lg mx-auto ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
          Tout ce que vous devez savoir pour profiter au mieux de votre expérience de streaming Ultra HD sans interruption.
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-3.5">
        {faqData.map((item) => {
          const isOpen = activeId === item.id;
          return (
            <div
              key={item.id}
              className={`rounded-xl border overflow-hidden transition-all ${
                theme === "dark"
                  ? "bg-[#0f1422] border-slate-800 hover:border-slate-700"
                  : "bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300"
              }`}
              id={`faq-item-${item.id}`}
            >
              <button
                onClick={() => toggleAccordion(item.id)}
                className={`w-full flex items-center justify-between p-4 text-left font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-violet-500/30 ${
                  theme === "dark"
                    ? "text-slate-100 hover:text-white"
                    : "text-slate-900 hover:text-amber-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg border flex items-center justify-center shrink-0 ${
                    theme === "dark" ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}>
                    {item.icon}
                  </div>
                  <span className="text-sm font-semibold tracking-wide md:text-base">
                    {item.question}
                  </span>
                </div>
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className={`p-1 rounded-full ${theme === "dark" ? "text-slate-400 hover:bg-slate-800/50" : "text-slate-500 hover:bg-slate-100"}`}
                >
                  <ChevronDown className="w-5 h-5" />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className={`px-5 pb-5 pt-1 text-xs md:text-sm leading-relaxed border-t font-normal ${
                      theme === "dark" ? "border-slate-800/60 text-slate-300" : "border-slate-100 text-slate-700"
                    }`}>
                      <p className={`py-3 px-4 rounded-lg border ${
                        theme === "dark"
                          ? "bg-slate-950/40 border-slate-800/40 text-slate-300"
                          : "bg-slate-50 border-slate-200/80 text-slate-700"
                      }`}>
                        {item.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
