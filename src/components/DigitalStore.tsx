import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Tv, Sparkles, Shield, Zap, Search, ShoppingBag, Check, Plus, Minus, Trash2, 
  X, Star, Lock, MessageSquare, Headphones, ShieldCheck, Palette, Bot, 
  FileText, TrendingUp, Share2, Users, PlayCircle, Film, ChevronRight,
  CreditCard, Smartphone, CheckCircle, ArrowRight, ArrowLeft, Home, ExternalLink, HelpCircle, Flame, Globe
} from "lucide-react";
import { DigitalProduct, CartItem, ProductCategory } from "../types/store";
import { useLanguage } from "../lib/i18n";
import { COUNTRIES, detectUserCountry, getProductPriceForRegion, getOriginalPriceForRegion, formatPriceValue, CountryInfo } from "../lib/regionalPricing";
import SEOContentSection from "./SEOContentSection";

interface DigitalStoreProps {
  onNavigateToIPTV: () => void;
  onNavigateToAdmin: () => void;
}

export default function DigitalStore({ onNavigateToIPTV, onNavigateToAdmin }: DigitalStoreProps) {
  const { t, theme } = useLanguage();
  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  
  // Regional Pricing & Country State
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo>(() => detectUserCountry());
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState("");

  // Search and Category filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | ProductCategory>("all");
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("digital_store_cart");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Checkout Form
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "form" | "success">("cart");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"crypto" | "card" | "paypal" | "western_union" | "mobile_money">("card");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Toast Notification State
  const [toasts, setToasts] = useState<Array<{ id: string; title: string; description?: string; type?: "success" | "info" | "warning" }>>([]);

  const addToast = (title: string, description?: string, type: "success" | "info" | "warning" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Sync cart to localStorage
  useEffect(() => {
    localStorage.setItem("digital_store_cart", JSON.stringify(cart));
  }, [cart]);

  // Fetch products from server/API interceptor
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch("/api/store/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error("Error loading store products:", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Icon mapper helper
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case "Tv": return <Tv className="w-6 h-6 text-purple-400" />;
      case "Sparkles": return <Sparkles className="w-6 h-6 text-fuchsia-400" />;
      case "PlayCircle": return <PlayCircle className="w-6 h-6 text-cyan-400" />;
      case "Zap": return <Zap className="w-6 h-6 text-amber-400" />;
      case "Film": return <Film className="w-6 h-6 text-pink-400" />;
      case "ShieldCheck": return <ShieldCheck className="w-6 h-6 text-emerald-400" />;
      case "Palette": return <Palette className="w-6 h-6 text-indigo-400" />;
      case "Bot": return <Bot className="w-6 h-6 text-violet-400" />;
      case "FileText": return <FileText className="w-6 h-6 text-blue-400" />;
      case "Lock": return <Lock className="w-6 h-6 text-rose-400" />;
      case "Users": return <Users className="w-6 h-6 text-teal-400" />;
      case "TrendingUp": return <TrendingUp className="w-6 h-6 text-rose-400" />;
      case "Share2": return <Share2 className="w-6 h-6 text-sky-400" />;
      case "Star": return <Star className="w-6 h-6 text-amber-400" />;
      default: return <Sparkles className="w-6 h-6 text-purple-400" />;
    }
  };

  // Add to cart
  const addToCart = (product: DigitalProduct) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    const priceVal = getProductPriceForRegion(product, selectedCountry.region);
    addToast(
      "Produit ajouté au panier !",
      `${product.title} — ${formatPriceValue(priceVal, selectedCountry.currencySymbol, selectedCountry.currency)}`,
      "success"
    );
    setIsCartOpen(true);
  };

  // Buy now shortcut
  const buyNow = (product: DigitalProduct) => {
    addToCart(product);
    setCheckoutStep("form");
  };

  // Update quantity in cart
  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // Total cart amount calculation based on detected region
  const cartTotal = cart.reduce((sum, item) => {
    const p = getProductPriceForRegion(item.product, selectedCountry.region);
    return sum + p * item.quantity;
  }, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Submit Checkout
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
      setOrderError("Veuillez remplir tous les champs obligatoires (Nom, Email, WhatsApp).");
      return;
    }

    if (cart.length === 0) {
      setOrderError("Votre panier est vide.");
      return;
    }

    setIsSubmitting(true);
    setOrderError("");

    try {
      const res = await fetch("/api/store/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          paymentMethod,
          items: cart,
          totalAmount: cartTotal,
          currency: selectedCountry.currency,
          currencySymbol: selectedCountry.symbol,
          regionCode: selectedCountry.region
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCompletedOrder(data.order);
        setCart([]);
        setCheckoutStep("success");
        addToast(
          "Commande validée avec succès !",
          "Votre accès vous sera transmis par WhatsApp sous quelques minutes.",
          "success"
        );
      } else {
        setOrderError(data.error || "Une erreur est survenue lors du paiement.");
      }
    } catch (err) {
      setOrderError("Connexion impossible avec le serveur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter products by category & search
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.durationOrType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#09090b] text-slate-100 font-sans relative selection:bg-purple-500/30 selection:text-white w-full">
      
      {/* Dynamic Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/10 blur-[150px]" />
        <div className="absolute top-[30%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-fuchsia-600/10 blur-[150px]" />
      </div>

      {/* STICKY GLASSMORPHISM NAVBAR */}
      <header className="sticky top-0 z-40 bg-[#09090b]/85 backdrop-blur-xl border-b border-white/10 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          
          {/* Button to Home / Accueil */}
          <button
            onClick={onNavigateToIPTV}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold hover:text-white transition-all cursor-pointer shadow-sm"
          >
            <Home className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Accueil</span>
          </button>

          {/* Right Controls: Country Selector + Shopping Cart Button */}
          <div className="flex items-center gap-2.5">
            {/* Country & Currency Detection Button */}
            <button
              onClick={() => setIsCountryModalOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 text-slate-200 text-xs font-medium cursor-pointer transition-all shadow-sm group"
              title="Changer de pays / devise"
            >
              <span className="text-base">{selectedCountry.flag}</span>
              <span className="hidden md:inline font-semibold">{selectedCountry.name}</span>
              <span className="text-cyan-400 font-mono font-bold">({selectedCountry.symbol})</span>
              <Globe className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative group p-2.5 rounded-xl bg-gradient-to-r from-purple-600/20 to-cyan-500/20 border border-purple-500/30 hover:border-cyan-400/50 text-white transition-all shadow-lg shadow-purple-500/10 flex items-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold hidden sm:inline">Panier</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-mono text-[10px] font-bold flex items-center justify-center animate-bounce shadow-md">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500/10 via-fuchsia-500/10 to-cyan-500/10 border border-purple-500/30 text-xs font-medium backdrop-blur-md text-purple-300"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Revente Officielle & Livraison Instantanée 24h/7d</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none font-display"
          >
            Abonnements VOD, Clés Logiciels & <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
              Services Boost Social
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            Accédez aux meilleurs comptes streaming (Netflix, Disney+, Canal+), clés de licences authentiques (Windows, Canva Pro, ChatGPT) et boosts réseaux au meilleur prix.
          </motion.p>

          {/* Search Bar & Autocomplete */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="relative max-w-xl mx-auto mt-8"
          >
            <div className="relative flex items-center rounded-2xl bg-[#0d0d12]/90 border border-purple-500/30 p-1.5 focus-within:border-cyan-400 shadow-xl shadow-purple-900/20 backdrop-blur-md transition-all">
              <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher (ex: Netflix, Windows 11, Canva, ChatGPT, TikTok...)" 
                className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")} 
                  className="p-1 hover:bg-white/10 rounded-full text-slate-400 mr-2"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>

          {/* Reassurance Badges */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left max-w-4xl mx-auto">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">Livraison Instantanée</p>
                <p className="text-[10px] text-slate-400">Réception par mail / WhatsApp</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">Garantie Totale</p>
                <p className="text-[10px] text-slate-400">Remplacement sans frais</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
              <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">Paiement Sécurisé</p>
                <p className="text-[10px] text-slate-400">Crypto, CB, Mobile Money</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
              <Headphones className="w-4 h-4 text-purple-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">Support 24/7</p>
                <p className="text-[10px] text-slate-400">Assistance client réactive</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* POPULAR CATEGORIES CARDS */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10 relative">
        <h2 className="text-xl font-bold tracking-tight text-white mb-6 flex items-center gap-2 font-display">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <span>Catégories Populaires</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Streaming & VOD */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedCategory("streaming")}
            className={`cursor-pointer rounded-2xl p-6 bg-gradient-to-b from-[#12101e] to-[#0d0d12] border transition-all relative overflow-hidden group ${selectedCategory === "streaming" ? "border-purple-500 ring-2 ring-purple-500/20" : "border-purple-500/20 hover:border-purple-500/50"}`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all" />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Tv className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">Streaming & VOD</h3>
                <p className="text-xs text-slate-400">Comptes VIP & Profils Privés</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 mb-4 line-clamp-2">
              Netflix 4K, Disney+, Canal+, Prime Video, Crunchyroll, ADN, HBO Max en Ultra HD à prix imbattable.
            </p>
            <div className="flex items-center justify-between text-xs font-semibold text-purple-400 pt-2 border-t border-white/5">
              <span>Voir les abonnements</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>

          {/* Card 2: Clés & Logiciels */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedCategory("software")}
            className={`cursor-pointer rounded-2xl p-6 bg-gradient-to-b from-[#0e1620] to-[#0d0d12] border transition-all relative overflow-hidden group ${selectedCategory === "software" ? "border-cyan-500 ring-2 ring-cyan-500/20" : "border-cyan-500/20 hover:border-cyan-500/50"}`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all" />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">Clés & Logiciels</h3>
                <p className="text-xs text-slate-400">Licences Officieuses & IA</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 mb-4 line-clamp-2">
              Windows 11 Pro, Office 365, Canva Pro, ChatGPT Plus (GPT-4o), Antivirus Kaspersky.
            </p>
            <div className="flex items-center justify-between text-xs font-semibold text-cyan-400 pt-2 border-t border-white/5">
              <span>Voir les logiciels</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>

          {/* Card 3: Boost Réseaux Sociaux */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedCategory("social")}
            className={`cursor-pointer rounded-2xl p-6 bg-gradient-to-b from-[#1a0f1c] to-[#0d0d12] border transition-all relative overflow-hidden group ${selectedCategory === "social" ? "border-fuchsia-500 ring-2 ring-fuchsia-500/20" : "border-fuchsia-500/20 hover:border-fuchsia-500/50"}`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-2xl group-hover:bg-fuchsia-500/20 transition-all" />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-fuchsia-300 transition-colors">Boost Réseaux</h3>
                <p className="text-xs text-slate-400">Abonnés, Likes & Vues</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 mb-4 line-clamp-2">
              Propulsez vos comptes TikTok, Instagram, YouTube, Facebook, X (Twitter) et Avis Google 5★.
            </p>
            <div className="flex items-center justify-between text-xs font-semibold text-fuchsia-400 pt-2 border-t border-white/5">
              <span>Voir les boosts</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>

        </div>
      </section>

      {/* PRODUCT CATALOG & FILTER BAR */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10 relative" id="catalog">
        
        {/* Category Tab Selector */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === "all"
                  ? "bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-lg shadow-purple-500/20"
                  : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              Tous les Produits ({products.length})
            </button>
            <button
              onClick={() => setSelectedCategory("streaming")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === "streaming"
                  ? "bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-lg shadow-purple-500/20"
                  : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              🎬 Streaming & VOD
            </button>
            <button
              onClick={() => setSelectedCategory("software")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === "software"
                  ? "bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-lg shadow-purple-500/20"
                  : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              🔑 Clés & Logiciels
            </button>
            <button
              onClick={() => setSelectedCategory("social")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === "social"
                  ? "bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-lg shadow-purple-500/20"
                  : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              🚀 Boost Réseaux
            </button>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            {filteredProducts.length} produit(s) disponible(s)
          </div>
        </div>

        {/* PRODUCTS GRID */}
        {loadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div 
                key={index}
                className="rounded-2xl bg-[#0d0d12] border border-white/10 p-5 flex flex-col justify-between shadow-xl animate-pulse relative overflow-hidden"
              >
                {/* Shimmer gradient effect */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-[shimmer_2s_infinite]" />

                <div>
                  {/* Top Header: Badge & Stock Skeletons */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="h-5 w-24 bg-slate-800/80 rounded-full" />
                    <div className="h-5 w-20 bg-slate-800/80 rounded-full" />
                  </div>

                  {/* Title & Icon Skeleton */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-800/80 shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-3/4 bg-slate-800/80 rounded" />
                      <div className="h-3 w-1/2 bg-slate-800/50 rounded" />
                    </div>
                  </div>

                  {/* Description Skeleton */}
                  <div className="space-y-2 mb-4">
                    <div className="h-3 w-full bg-slate-800/60 rounded" />
                    <div className="h-3 w-4/5 bg-slate-800/60 rounded" />
                  </div>

                  {/* Features List Skeleton */}
                  <div className="space-y-2 mb-5 border-t border-white/5 pt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 bg-slate-800/80 rounded-full shrink-0" />
                      <div className="h-2.5 w-32 bg-slate-800/60 rounded" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 bg-slate-800/80 rounded-full shrink-0" />
                      <div className="h-2.5 w-28 bg-slate-800/60 rounded" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 bg-slate-800/80 rounded-full shrink-0" />
                      <div className="h-2.5 w-36 bg-slate-800/60 rounded" />
                    </div>
                  </div>
                </div>

                {/* Footer Price & Buttons Skeleton */}
                <div className="pt-3 border-t border-white/5 mt-auto">
                  <div className="flex items-baseline justify-between mb-4">
                    <div className="space-y-1">
                      <div className="h-2.5 w-16 bg-slate-800/50 rounded" />
                      <div className="h-6 w-24 bg-slate-800/80 rounded" />
                    </div>
                    <div className="h-4 w-16 bg-slate-800/50 rounded-full" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-9 bg-slate-800/80 rounded-xl" />
                    <div className="h-9 bg-purple-900/40 border border-purple-500/20 rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center bg-[#0d0d12]/50 rounded-2xl border border-white/5 p-8">
            <Search className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">Aucun produit trouvé</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Essayez de modifier votre recherche ou de changer de catégorie.
            </p>
            <button
              onClick={() => { setSelectedCategory("all"); setSearchQuery(""); }}
              className="mt-4 px-4 py-2 bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-semibold hover:bg-purple-600/30 transition-all"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                whileHover={{ y: -6, scale: 1.01 }}
                transition={{ duration: 0.2 }}
                className="group relative rounded-2xl bg-[#0d0d12] border border-white/10 p-5 flex flex-col justify-between hover:border-transparent hover:ring-2 hover:ring-purple-500/50 shadow-xl transition-all overflow-hidden"
              >
                {/* Glow Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-bl from-purple-500/20 to-cyan-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform pointer-events-none" />

                <div>
                  {/* Top Header: Badge & Stock with Framer Motion hover effects */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {product.badge ? (
                      <motion.span 
                        whileHover={{ scale: 1.08, rotate: -2 }}
                        className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-fuchsia-500/20 to-purple-500/20 border border-amber-500/40 text-[10px] font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-1 shadow-sm shadow-amber-500/20"
                      >
                        <Flame className="w-3 h-3 text-amber-400 animate-pulse" />
                        {product.badge}
                      </motion.span>
                    ) : (
                      <motion.span 
                        whileHover={{ scale: 1.05 }}
                        className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-mono flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                        {product.durationOrType}
                      </motion.span>
                    )}

                    {product.stockStatus === "low_stock" ? (
                      <motion.span 
                        whileHover={{ scale: 1.08 }}
                        className="text-[10px] font-extrabold font-mono px-2.5 py-1 rounded-full bg-gradient-to-r from-rose-500/20 to-amber-500/20 border border-rose-500/40 text-rose-300 flex items-center gap-1 shadow-sm shadow-rose-500/20"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                        Stock Limité
                      </motion.span>
                    ) : product.stockStatus === "in_stock" ? (
                      <motion.span 
                        whileHover={{ scale: 1.05 }}
                        className="text-[10px] font-semibold font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        En stock
                      </motion.span>
                    ) : (
                      <motion.span 
                        whileHover={{ scale: 1.05 }}
                        className="text-[10px] font-semibold font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700"
                      >
                        Rupture
                      </motion.span>
                    )}
                  </div>

                  {/* Title & Icon */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 group-hover:border-purple-500/40 transition-colors">
                      {renderIcon(product.iconName)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                        {product.title}
                      </h3>
                      <p className="text-[11px] font-mono text-cyan-400 mt-0.5">
                        {product.durationOrType}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>

                  {/* Features list */}
                  {product.features && product.features.length > 0 && (
                    <ul className="space-y-1.5 mb-5 border-t border-white/5 pt-3">
                      {product.features.map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="line-clamp-1">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Footer Price & Actions */}
                <div className="pt-3 border-t border-white/5 mt-auto">
                  <div className="flex items-baseline justify-between mb-4">
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <span>{selectedCountry.flag}</span>
                        <span>Tarif {selectedCountry.name}</span>
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-black text-white font-display">
                          {formatPriceValue(
                            getProductPriceForRegion(product, selectedCountry.region),
                            selectedCountry.currencySymbol,
                            selectedCountry.currency
                          )}
                        </span>
                        {getOriginalPriceForRegion(product, selectedCountry.region) && (
                          <span className="text-xs text-slate-500 line-through font-mono">
                            {formatPriceValue(
                              getOriginalPriceForRegion(product, selectedCountry.region)!,
                              selectedCountry.currencySymbol,
                              selectedCountry.currency
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      Livraison 5 min
                    </span>
                  </div>

                  {/* Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => addToCart(product)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5 text-purple-400" />
                      Panier
                    </button>
                    <button
                      onClick={() => buyNow(product)}
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-xs font-bold text-white shadow-md shadow-purple-500/20 flex items-center justify-center gap-1 transition-all active:scale-95"
                    >
                      Acheter
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </motion.div>
            ))}
          </div>
        )}

      </section>

      {/* LIVE REVIEWS CAROUSEL SECTION */}
      <section className="py-16 bg-[#07070a] border-y border-white/5 relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 font-medium mb-3">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>4.9 / 5 sur +1,200 Avis Vérifiés</span>
          </div>
          <h2 className="text-2xl font-bold text-white font-display">Ce que disent nos clients</h2>
        </div>

        {/* Marquee Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto px-4">
          <div className="p-5 rounded-2xl bg-[#0d0d12] border border-white/5 relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Achat Vérifié
              </span>
            </div>
            <p className="text-xs text-slate-300 italic mb-4 leading-relaxed">
              "Abonnement Netflix 4K activé en moins de 3 minutes sur mon compte. Qualité vidéo parfaite sans aucune déconnexion."
            </p>
            <div className="flex items-center justify-between text-xs pt-3 border-t border-white/5">
              <span className="font-bold text-white">Marc D.</span>
              <span className="text-slate-500 text-[10px]">Netflix 4K • Hier</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0d0d12] border border-white/5 relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Achat Vérifié
              </span>
            </div>
            <p className="text-xs text-slate-300 italic mb-4 leading-relaxed">
              "Clé Windows 11 Pro activée instantanément sur le site officiel Microsoft. Prix imbattable et support WhatsApp très aimable."
            </p>
            <div className="flex items-center justify-between text-xs pt-3 border-t border-white/5">
              <span className="font-bold text-white">Sami K.</span>
              <span className="text-slate-500 text-[10px]">Windows 11 Pro • Il y a 2 jours</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0d0d12] border border-white/5 relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Achat Vérifié
              </span>
            </div>
            <p className="text-xs text-slate-300 italic mb-4 leading-relaxed">
              "Boost de 1000 abonnés TikTok livré progressivement dans la soirée. Mon profil est maintenant crédible pour mes lives !"
            </p>
            <div className="flex items-center justify-between text-xs pt-3 border-t border-white/5">
              <span className="font-bold text-white">Élodie B.</span>
              <span className="text-slate-500 text-[10px]">Boost TikTok • Il y a 3 jours</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ ACCORDION SECTION */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto z-10 relative">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-white font-display mb-2">Foire Aux Questions (FAQ)</h2>
          <p className="text-xs text-slate-400">Tout ce qu'il faut savoir avant de commander</p>
        </div>

        <div className="space-y-3">
          {[
            {
              q: "Comment se déroule la livraison de ma commande ?",
              a: "Dès votre achat validé, vos identifiants ou votre clé de licence sont immédiatement envoyés à votre adresse e-mail ainsi que sur votre numéro WhatsApp sous 5 à 15 minutes."
            },
            {
              q: "Les comptes et clés de licence sont-ils officiels ?",
              a: "Oui, à 100%. Toutes nos clés de logiciels sont authentiques et vérifiées auprès des éditeurs (Microsoft, Kaspersky). Nos abonnements VOD sont délivrés sous forme de comptes personnels ou profils privés sécurisés."
            },
            {
              q: "Que faire en cas de problème ou besoin d'assistance ?",
              a: "Notre service client est disponible 24h/24 et 7j/7 via WhatsApp et formulaire de support. Si un compte rencontre un souci, nous procédons à un remplacement immédiat."
            },
            {
              q: "Quels sont les moyens de paiement acceptés ?",
              a: "Nous acceptons les cartes bancaires, PayPal, la Cryptomonnaie (USDT, BTC), Mobile Money (MTN, Orange) et Western Union."
            }
          ].map((faq, idx) => (
            <div 
              key={idx}
              className="rounded-xl bg-[#0d0d12] border border-white/5 overflow-hidden transition-colors"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-4 text-left font-semibold text-sm text-white flex items-center justify-between hover:text-purple-300 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-purple-400 shrink-0" />
                  {faq.q}
                </span>
                <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === idx ? "rotate-90 text-purple-400" : ""}`} />
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-4 pt-1 text-xs text-slate-400 leading-relaxed border-t border-white/5 bg-white/[0.01]">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* SHOPPING CART DRAWER / MODAL */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-[#0d0d12] border-l border-white/10 h-full flex flex-col justify-between shadow-2xl relative z-10"
            >
              
              {/* Header */}
              <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#09090b]">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-purple-400" />
                  <h3 className="font-bold text-white text-base">Votre Panier ({cartCount})</h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="p-5 flex-1 overflow-y-auto space-y-4 no-scrollbar">
                
                {checkoutStep === "cart" && (
                  <>
                    {cart.length === 0 ? (
                      <div className="py-20 text-center">
                        <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">Votre panier est actuellement vide.</p>
                        <button
                          onClick={() => setIsCartOpen(false)}
                          className="mt-4 px-4 py-2 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 text-xs font-semibold hover:bg-purple-600/30 transition-all"
                        >
                          Découvrir les produits
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {cart.map((item) => (
                          <div
                            key={item.product.id}
                            className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                                {renderIcon(item.product.iconName)}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-white truncate">{item.product.title}</h4>
                                <p className="text-[10px] text-cyan-400 font-mono">{item.product.durationOrType}</p>
                                <p className="text-xs font-bold text-purple-300 mt-0.5">
                                  {formatPriceValue(
                                    getProductPriceForRegion(item.product, selectedCountry.region) * item.quantity,
                                    selectedCountry.currencySymbol,
                                    selectedCountry.currency
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="flex items-center border border-slate-800 rounded-lg bg-slate-900">
                                <button
                                  onClick={() => updateQuantity(item.product.id, -1)}
                                  className="p-1 hover:bg-white/10 text-slate-400 rounded-l-lg"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="px-2 text-xs font-mono text-white font-bold">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.product.id, 1)}
                                  className="p-1 hover:bg-white/10 text-slate-400 rounded-r-lg"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              <button
                                onClick={() => removeFromCart(item.product.id)}
                                className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {checkoutStep === "form" && (
                  <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                      <span className="text-xs font-semibold text-slate-400">Coordonnées de livraison</span>
                      <button
                        type="button"
                        onClick={() => setCheckoutStep("cart")}
                        className="text-xs text-purple-400 hover:underline"
                      >
                        ← Retour au panier
                      </button>
                    </div>

                    {orderError && (
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                        {orderError}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Nom complet *</label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Ex: Jean Dupont"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">E-mail de livraison *</label>
                      <input
                        type="email"
                        required
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="votre-email@domaine.com"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Numéro WhatsApp (avec indicatif) *</label>
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+33 6 12 34 56 78"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">Utilisé pour l'envoi direct de vos accès par message.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-2">Moyen de paiement</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: "card", label: "Carte Bancaire", icon: CreditCard },
                          { id: "crypto", label: "Crypto (USDT/BTC)", icon: Zap },
                          { id: "paypal", label: "PayPal", icon: Lock },
                          { id: "mobile_money", label: "Mobile Money", icon: Smartphone }
                        ].map((pm) => {
                          const IconComp = pm.icon;
                          return (
                            <button
                              key={pm.id}
                              type="button"
                              onClick={() => setPaymentMethod(pm.id as any)}
                              className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                                paymentMethod === pm.id
                                  ? "bg-purple-500/20 border-purple-500 text-white"
                                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                              }`}
                            >
                              <IconComp className="w-4 h-4 text-purple-400 shrink-0" />
                              <span className="text-[11px] font-semibold">{pm.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </form>
                )}

                {checkoutStep === "success" && completedOrder && (
                  <div className="py-8 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto animate-bounce">
                      <CheckCircle className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-white font-display">Commande Validée !</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Merci <span className="font-semibold text-purple-300">{completedOrder.customerName}</span> ! <br />
                      Votre commande <span className="font-mono text-cyan-400">#{completedOrder.id.slice(0, 8)}</span> a été traitée.
                    </p>
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-left text-xs space-y-2">
                      <p className="text-slate-400">📩 <strong className="text-white">Email:</strong> {completedOrder.customerEmail}</p>
                      <p className="text-slate-400">📱 <strong className="text-white">WhatsApp:</strong> {completedOrder.customerPhone}</p>
                      <p className="text-slate-400">💳 <strong className="text-white">Total réglé:</strong> {formatPriceValue(completedOrder.totalAmount, completedOrder.currencySymbol || selectedCountry.currencySymbol, completedOrder.currency || selectedCountry.currency)}</p>
                    </div>
                    <p className="text-[11px] text-amber-400 font-mono">
                      Vos identifiants et accès vous sont transmis par WhatsApp sous quelques minutes.
                    </p>
                    <button
                      onClick={() => {
                        setCheckoutStep("cart");
                        setIsCartOpen(false);
                      }}
                      className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-500 transition-all shadow-lg shadow-purple-500/20"
                    >
                      Retour à la boutique
                    </button>
                  </div>
                )}

              </div>

              {/* Drawer Footer Total & Proceed */}
              {cart.length > 0 && checkoutStep !== "success" && (
                <div className="p-5 border-t border-white/10 bg-[#09090b] space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Total à payer</span>
                    <span className="text-xl font-black text-white font-display">
                      {formatPriceValue(cartTotal, selectedCountry.currencySymbol, selectedCountry.currency)}
                    </span>
                  </div>

                  {checkoutStep === "cart" ? (
                    <button
                      onClick={() => setCheckoutStep("form")}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-400 text-white font-bold text-xs shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 hover:opacity-95 transition-all cursor-pointer"
                    >
                      Passer la commande ({formatPriceValue(cartTotal, selectedCountry.currencySymbol, selectedCountry.currency)})
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleCheckoutSubmit}
                      disabled={isSubmitting}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Confirmer & Payer ({formatPriceValue(cartTotal, selectedCountry.currencySymbol, selectedCountry.currency)})
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* COUNTRY & CURRENCY SELECTION MODAL */}
      <AnimatePresence>
        {isCountryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg bg-[#0d0d12] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-cyan-400" />
                  <div>
                    <h3 className="font-bold text-white text-base font-display">Pays & Devise de la Boutique</h3>
                    <p className="text-[11px] text-slate-400">
                      Détection automatique : <span className="text-cyan-300 font-semibold">{selectedCountry.flag} {selectedCountry.name} ({selectedCountry.symbol})</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCountryModalOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Country Search */}
              <div className="relative mb-4">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Rechercher un pays (France, USA, Côte d'Ivoire, Sénégal...)..."
                  value={countrySearchQuery}
                  onChange={(e) => setCountrySearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Country Grid */}
              <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                {COUNTRIES
                  .filter(c => c.name.toLowerCase().includes(countrySearchQuery.toLowerCase()) || c.code.toLowerCase().includes(countrySearchQuery.toLowerCase()) || c.currency.toLowerCase().includes(countrySearchQuery.toLowerCase()))
                  .map(country => (
                    <button
                      key={country.code}
                      onClick={() => {
                        setSelectedCountry(country);
                        localStorage.setItem("user_selected_country", country.code);
                        setIsCountryModalOpen(false);
                        addToast(
                          "Pays mis à jour !",
                          `Boutique adaptée pour ${country.flag} ${country.name} (${country.symbol})`,
                          "info"
                        );
                      }}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        selectedCountry.code === country.code
                          ? "bg-purple-600/20 border-purple-500 text-white font-bold"
                          : "bg-white/[0.02] border-white/5 hover:border-white/20 text-slate-300 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{country.flag}</span>
                        <div>
                          <p className="text-xs font-semibold">{country.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">Région : {country.region.toUpperCase()}</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                        {country.currency} ({country.symbol})
                      </span>
                    </button>
                  ))}
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 text-center">
                <button
                  onClick={() => setIsCountryModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl hover:text-white transition-all cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SEO SECTION FOR SEARCH ENGINE INDEXING & HIGH KEYWORD DENSITY */}
      <SEOContentSection />

      {/* TOAST NOTIFICATION CONTAINER */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="pointer-events-auto bg-[#0d0d12]/95 border border-purple-500/40 backdrop-blur-xl p-4 rounded-2xl shadow-2xl shadow-purple-950/60 flex items-start justify-between gap-3 text-white"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 shadow-sm">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-display">{toast.title}</h4>
                  {toast.description && (
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{toast.description}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
