import React from "react";
import { ShieldCheck, Tv, Zap, Cpu, Sparkles, CheckCircle2, Globe, Headphones, PlayCircle, Smartphone } from "lucide-react";
import { useLanguage } from "../lib/i18n";

export default function SEOContentSection() {
  const { theme } = useLanguage();

  return (
    <section 
      aria-label="Informations et Référencement Power IPTV Premium" 
      className="w-full max-w-6xl mx-auto mt-16 mb-12 px-4 text-left"
      id="power-iptv-seo-article"
    >
      <div className={`rounded-3xl border p-6 sm:p-10 shadow-2xl transition-colors ${
        theme === "dark" 
          ? "bg-[#0b0f19]/90 border-slate-800/80 text-slate-300" 
          : "bg-white/95 border-amber-200/80 text-slate-700 shadow-amber-900/5"
      }`}>
        
        {/* Header Badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold font-mono">
            <Zap className="w-3.5 h-3.5" />
            POWER IPTV OFFICIEL 2026
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Serveurs Ultra Stables 4K
          </span>
        </div>

        {/* Main H1/H2 Heading */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-white">
          Power IPTV : N°1 de l'Abonnement IPTV Premium 4K & Streaming TV en Direct
        </h2>

        <p className="text-sm sm:text-base leading-relaxed text-slate-300 mb-8">
          Bienvenue sur la plateforme officielle <strong>Power IPTV</strong>. Découvrez l'expérience de divertissement ultime avec notre service d'<strong>abonnement IPTV Premium</strong>. Grâce à notre infrastructure de serveurs à haut débit équilibrés et anti-freeze, <strong>Power IPTV</strong> vous offre un accès illimité à plus de <strong>20 000 chaînes de télévision en direct</strong> et <strong>60 000 films et séries VOD en 4K Ultra HD</strong>. Que vous soyez passionné de sport en direct (Ligue 1, Champions League, UFC, Formule 1), de cinéma récent ou de séries exclusives, <strong>Power IPTV Player</strong> répond à toutes vos attentes.
        </p>

        {/* Grid 3 Columns Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          
          <div className={`p-5 rounded-2xl border ${
            theme === "dark" ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-200"
          }`}>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 w-fit mb-3">
              <Tv className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">
              Power IPTV Smart TV & Android
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Compatibilité 100% garantie avec Smart TV Samsung (Tizen), LG (WebOS), Sony, TCL, Android TV Box, Amazon Firestick, Apple TV et smartphones iOS/Android.
            </p>
          </div>

          <div className={`p-5 rounded-2xl border ${
            theme === "dark" ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-200"
          }`}>
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 w-fit mb-3">
              <PlayCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">
              Power IPTV Web Player Intégré
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Accédez directement à vos chaînes et playlists via notre lecteur web en ligne <strong>Power IPTV Player</strong> sans avoir à installer d'application tierce.
            </p>
          </div>

          <div className={`p-5 rounded-2xl border ${
            theme === "dark" ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-200"
          }`}>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">
              Technologie Anti-Coupure Anti-Freeze
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Nos serveurs CDN distribués en Europe et en Amérique assurent un taux de disponibilité de 99.9% avec commutation automatique de flux.
            </p>
          </div>

        </div>

        {/* Detailed SEO Sections */}
        <div className="space-y-6 text-xs sm:text-sm text-slate-300">
          
          <div>
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-400" />
              Pourquoi Choisir un Abonnement Power IPTV Premium en 2026 ?
            </h3>
            <p className="leading-relaxed">
              En optant pour un <strong>abonnement Power IPTV</strong>, vous bénéficiez du meilleur rapport qualité-prix du marché. Contrairement aux fournisseurs ordinaires, <strong>Power IPTV France</strong> propose une qualité d'image adaptative (4K Ultra HD, Full HD 1080p, HD 720p) qui s'ajuste automatiquement à votre connexion Internet (Fibre, ADSL, 4G, 5G). Profitez des plus grands événements sportifs sur Canal+, beIN Sports, RMC Sport, DAZN et Eurosport sans le moindre décalage.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-amber-400" />
              Compatibilité avec IPTV Smarters Pro, Smart IPTV & Xtream Codes
            </h3>
            <p className="leading-relaxed mb-3">
              Votre identifiant <strong>Power IPTV</strong> s'intègre en quelques secondes sur toutes les applications de lecture streaming populaires :
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-slate-300">
              <li className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                IPTV Smarters Pro & Smarters Player Lite
              </li>
              <li className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                Smart IPTV (SIPTV) & IBO Player
              </li>
              <li className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                XCIPTV Player & TiviMate IPTV
              </li>
              <li className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                Net IPTV, GSE Smart IPTV & SS IPTV
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Headphones className="w-4 h-4 text-amber-400" />
              Livraison Instantanée de Votre Code Power IPTV & Assistance 24/7
            </h3>
            <p className="leading-relaxed">
              Dès la validation de votre commande sur notre boutique officielle, vos codes d'accès <strong>Power IPTV (Username, Password, URL Server Xtream API)</strong> vous sont délivrés instantanément. Notre équipe de support technique réactive est à votre disposition 24h/24 et 7j/7 pour vous guider lors de l'installation sur votre Smart TV, Box Android ou smartphone.
            </p>
          </div>

        </div>

        {/* Popular Search Keywords Tags for SEO Indexing */}
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
            Mots-clés fréquemment recherchés sur Google :
          </p>
          <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-400 font-mono">
            <span className="bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800">power iptv</span>
            <span className="bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800">power iptv abonnement</span>
            <span className="bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800">power iptv player</span>
            <span className="bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800">power iptv login</span>
            <span className="bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800">power iptv smart tv</span>
            <span className="bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800">power iptv smarters pro</span>
            <span className="bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800">abonnement power iptv 12 mois</span>
            <span className="bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800">power iptv france</span>
            <span className="bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800">iptv premium 4k</span>
            <span className="bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800">meilleur abonnement iptv sans coupure</span>
            <span className="bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800">power iptv code</span>
            <span className="bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800">power iptv boutique officielle</span>
          </div>
        </div>

      </div>
    </section>
  );
}
