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
    const isDark = theme === "dark";
    switch (iconName) {
      case "Tv": return <Tv className={`w-5 h-5 ${isDark ? "text-amber-400" : "text-amber-600"}`} />;
      case "Sparkles": return <Sparkles className={`w-5 h-5 ${isDark ? "text-amber-400" : "text-amber-600"}`} />;
      case "PlayCircle": return <PlayCircle className={`w-5 h-5 ${isDark ? "text-amber-400" : "text-amber-600"}`} />;
      case "Zap": return <Zap className={`w-5 h-5 ${isDark ? "text-amber-400" : "text-amber-600"}`} />;
      case "Film": return <Film className={`w-5 h-5 ${isDark ? "text-amber-400" : "text-amber-600"}`} />;
      case "ShieldCheck": return <ShieldCheck className={`w-5 h-5 ${isDark ? "text-emerald-400" : "text-emerald-600"}`} />;
      case "Palette": return <Palette className={`w-5 h-5 ${isDark ? "text-amber-400" : "text-amber-600"}`} />;
      case "Bot": return <Bot className={`w-5 h-5 ${isDark ? "text-amber-400" : "text-amber-600"}`} />;
      case "FileText": return <FileText className={`w-5 h-5 ${isDark ? "text-slate-300" : "text-slate-700"}`} />;
      case "Lock": return <Lock className={`w-5 h-5 ${isDark ? "text-amber-400" : "text-amber-600"}`} />;
      case "Users": return <Users className={`w-5 h-5 ${isDark ? "text-cyan-400" : "text-cyan-600"}`} />;
      case "TrendingUp": return <TrendingUp className={`w-5 h-5 ${isDark ? "text-amber-400" : "text-amber-600"}`} />;
      case "Share2": return <Share2 className={`w-5 h-5 ${isDark ? "text-amber-400" : "text-amber-600"}`} />;
      case "Star": return <Star className={`w-5 h-5 ${isDark ? "text-amber-400" : "text-amber-600"}`} />;
      default: return <Sparkles className={`w-5 h-5 ${isDark ? "text-amber-400" : "text-amber-600"}`} />;
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

  const isDark = theme === "dark";

  return (
    <div className={`min-h-screen font-sans relative selection:bg-amber-500/30 w-full transition-colors duration-300 ${
      isDark 
        ? "bg-[#0a0d16] text-slate-100 selection:text-white" 
        : "bg-[#f8fafc] text-slate-900 selection:text-slate-900"
    }`}>
      
      {/* Warm Ambient Glows matching login page */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[150px] transition-opacity ${
          isDark ? "bg-amber-500/10" : "bg-amber-300/20"
        }`} />
        <div className={`absolute top-[30%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] transition-opacity ${
          isDark ? "bg-amber-600/5" : "bg-amber-200/25"
        }`} />
        <div className={`absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full blur-[150px] transition-opacity ${
          isDark ? "bg-amber-700/5" : "bg-slate-200/40"
        }`} />
      </div>

      {/* STICKY NAVBAR */}
      <header className={`sticky top-0 z-40 backdrop-blur-xl border-b transition-all duration-200 ${
        isDark 
          ? "bg-[#0a0d16]/85 border-white/10" 
          : "bg-white/85 border-slate-200/80 shadow-xs"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          
          {/* Button to Home / Accueil */}
          <button
            onClick={onNavigateToIPTV}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs ${
              isDark 
                ? "bg-[#0d1222] border border-slate-800 hover:border-amber-500/40 text-slate-200 hover:text-white" 
                : "bg-white border border-slate-200 hover:border-amber-500/50 text-slate-700 hover:text-slate-900"
            }`}
          >
            <Home className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">Accueil</span>
          </button>

          {/* Right Controls: Country Selector + Shopping Cart Button */}
          <div className="flex items-center gap-2.5">
            {/* Country & Currency Detection Button */}
            <button
              onClick={() => setIsCountryModalOpen(true)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all shadow-xs group ${
                isDark 
                  ? "bg-[#0d1222] border border-slate-800 hover:border-amber-500/40 text-slate-200" 
                  : "bg-white border border-slate-200 hover:border-amber-500/50 text-slate-700"
              }`}
              title="Changer de pays / devise"
            >
              <span className="text-base">{selectedCountry.flag}</span>
              <span className="hidden md:inline font-semibold">{selectedCountry.name}</span>
              <span className="text-amber-500 font-mono font-bold">({selectedCountry.symbol})</span>
              <Globe className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-500 transition-colors" />
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className={`relative group p-2.5 rounded-xl border transition-all shadow-sm flex items-center gap-2 cursor-pointer ${
                isDark 
                  ? "bg-amber-500/10 border-amber-500/30 hover:border-amber-400 text-white shadow-amber-950/20" 
                  : "bg-amber-50 border-amber-300 hover:border-amber-400 text-slate-900"
              }`}
            >
              <ShoppingBag className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold hidden sm:inline">Panier</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 text-white font-mono text-[10px] font-bold flex items-center justify-center shadow-md">
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
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-md ${
              isDark 
                ? "bg-amber-500/10 border-amber-500/30 text-amber-300" 
                : "bg-amber-50 border-amber-300/80 text-amber-900 shadow-xs"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>Boutique Officielle & Livraison Instantanée 24h/7d</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none font-display ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Abonnements VOD, Clés Logiciels & <br className="hidden sm:block" />
            <span className="text-amber-500">
              Services Boost Social
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`text-base sm:text-lg max-w-2xl mx-auto leading-relaxed ${
              isDark ? "text-slate-400" : "text-slate-600"
            }`}
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
            <div className={`relative flex items-center rounded-2xl border p-1.5 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 shadow-md backdrop-blur-md transition-all ${
              isDark 
                ? "bg-[#0d1222] border-slate-800" 
                : "bg-white border-slate-200"
            }`}>
              <Search className={`w-5 h-5 ml-3 shrink-0 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher (ex: Netflix, Windows 11, Canva, ChatGPT, TikTok...)" 
                className={`w-full bg-transparent px-3 py-2 text-sm focus:outline-none ${
                  isDark ? "text-white placeholder-slate-500" : "text-slate-900 placeholder-slate-400"
                }`}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")} 
                  className={`p-1 rounded-full mr-2 transition-colors ${
                    isDark ? "hover:bg-white/10 text-slate-400" : "hover:bg-slate-100 text-slate-500"
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>

          {/* Reassurance Badges */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left max-w-4xl mx-auto">
            <div className={`flex items-center gap-2.5 p-3 rounded-xl border backdrop-blur-xs transition-colors ${
              isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-xs"
            }`}>
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <p className={`text-xs font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Livraison Instantanée</p>
                <p className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>Réception mail / WhatsApp</p>
              </div>
            </div>
            <div className={`flex items-center gap-2.5 p-3 rounded-xl border backdrop-blur-xs transition-colors ${
              isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-xs"
            }`}>
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <p className={`text-xs font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Garantie Totale</p>
                <p className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>Remplacement sans frais</p>
              </div>
            </div>
            <div className={`flex items-center gap-2.5 p-3 rounded-xl border backdrop-blur-xs transition-colors ${
              isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-xs"
            }`}>
              <Lock className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <p className={`text-xs font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Paiement Sécurisé</p>
                <p className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>Crypto, CB, Mobile Money</p>
              </div>
            </div>
            <div className={`flex items-center gap-2.5 p-3 rounded-xl border backdrop-blur-xs transition-colors ${
              isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-xs"
            }`}>
              <Headphones className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <p className={`text-xs font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Support 24/7</p>
                <p className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>Assistance réactive</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* POPULAR CATEGORIES CARDS */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10 relative">
        <h2 className={`text-xl font-bold tracking-tight mb-6 flex items-center gap-2 font-display ${
          isDark ? "text-white" : "text-slate-900"
        }`}>
          <Sparkles className="w-5 h-5 text-amber-500" />
          <span>Catégories Populaires</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Streaming & VOD */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedCategory("streaming")}
            className={`cursor-pointer rounded-2xl p-6 border transition-all relative overflow-hidden group shadow-sm ${
              selectedCategory === "streaming" 
                ? isDark 
                  ? "bg-[#0d1222] border-amber-500 ring-2 ring-amber-500/20" 
                  : "bg-white border-amber-500 ring-2 ring-amber-500/20"
                : isDark 
                  ? "bg-[#0d1222] border-slate-800 hover:border-amber-500/50" 
                  : "bg-white border-slate-200 hover:border-amber-500/50"
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${
                isDark 
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-400" 
                  : "bg-amber-50 border-amber-300 text-amber-600"
              }`}>
                <Tv className="w-6 h-6" />
              </div>
              <div>
                <h3 className={`text-lg font-bold transition-colors ${
                  isDark ? "text-white group-hover:text-amber-400" : "text-slate-900 group-hover:text-amber-600"
                }`}>Streaming & VOD</h3>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Comptes VIP & Profils Privés</p>
              </div>
            </div>
            <p className={`text-xs mb-4 line-clamp-2 leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              Netflix 4K, Disney+, Canal+, Prime Video, Crunchyroll, ADN, HBO Max en Ultra HD à prix imbattable.
            </p>
            <div className={`flex items-center justify-between text-xs font-semibold pt-2 border-t ${
              isDark ? "text-amber-400 border-white/5" : "text-amber-600 border-slate-100"
            }`}>
              <span>Voir les abonnements</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>

          {/* Card 2: Clés & Logiciels */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedCategory("software")}
            className={`cursor-pointer rounded-2xl p-6 border transition-all relative overflow-hidden group shadow-sm ${
              selectedCategory === "software" 
                ? isDark 
                  ? "bg-[#0d1222] border-amber-500 ring-2 ring-amber-500/20" 
                  : "bg-white border-amber-500 ring-2 ring-amber-500/20"
                : isDark 
                  ? "bg-[#0d1222] border-slate-800 hover:border-amber-500/50" 
                  : "bg-white border-slate-200 hover:border-amber-500/50"
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${
                isDark 
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                  : "bg-emerald-50 border-emerald-200 text-emerald-600"
              }`}>
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className={`text-lg font-bold transition-colors ${
                  isDark ? "text-white group-hover:text-amber-400" : "text-slate-900 group-hover:text-amber-600"
                }`}>Clés & Logiciels</h3>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Licences Officielles & IA</p>
              </div>
            </div>
            <p className={`text-xs mb-4 line-clamp-2 leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              Windows 11 Pro, Office 365, Canva Pro, ChatGPT Plus (GPT-4o), Antivirus Kaspersky.
            </p>
            <div className={`flex items-center justify-between text-xs font-semibold pt-2 border-t ${
              isDark ? "text-amber-400 border-white/5" : "text-amber-600 border-slate-100"
            }`}>
              <span>Voir les logiciels</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>

          {/* Card 3: Boost Réseaux Sociaux */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedCategory("social")}
            className={`cursor-pointer rounded-2xl p-6 border transition-all relative overflow-hidden group shadow-sm ${
              selectedCategory === "social" 
                ? isDark 
                  ? "bg-[#0d1222] border-amber-500 ring-2 ring-amber-500/20" 
                  : "bg-white border-amber-500 ring-2 ring-amber-500/20"
                : isDark 
                  ? "bg-[#0d1222] border-slate-800 hover:border-amber-500/50" 
                  : "bg-white border-slate-200 hover:border-amber-500/50"
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${
                isDark 
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-400" 
                  : "bg-amber-50 border-amber-300 text-amber-600"
              }`}>
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className={`text-lg font-bold transition-colors ${
                  isDark ? "text-white group-hover:text-amber-400" : "text-slate-900 group-hover:text-amber-600"
                }`}>Boost Réseaux</h3>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Abonnés, Likes & Vues</p>
              </div>
            </div>
            <p className={`text-xs mb-4 line-clamp-2 leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              Propulsez vos comptes TikTok, Instagram, YouTube, Facebook, X (Twitter) et Avis Google 5★.
            </p>
            <div className={`flex items-center justify-between text-xs font-semibold pt-2 border-t ${
              isDark ? "text-amber-400 border-white/5" : "text-amber-600 border-slate-100"
            }`}>
              <span>Voir les boosts</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>

        </div>
      </section>

      {/* PRODUCT CATALOG & FILTER BAR */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10 relative" id="catalog">
        
        {/* Category Tab Selector */}
        <div className={`flex items-center justify-between border-b pb-4 mb-8 flex-wrap gap-4 ${
          isDark ? "border-slate-800/80" : "border-slate-200"
        }`}>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                  : isDark 
                    ? "bg-[#0d1222] border border-slate-800 text-slate-300 hover:text-white hover:border-amber-500/30" 
                    : "bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-amber-500/40 shadow-xs"
              }`}
            >
              Tous les Produits ({products.length})
            </button>
            <button
              onClick={() => setSelectedCategory("streaming")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === "streaming"
                  ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                  : isDark 
                    ? "bg-[#0d1222] border border-slate-800 text-slate-300 hover:text-white hover:border-amber-500/30" 
                    : "bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-amber-500/40 shadow-xs"
              }`}
            >
              🎬 Streaming & VOD
            </button>
            <button
              onClick={() => setSelectedCategory("software")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === "software"
                  ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                  : isDark 
                    ? "bg-[#0d1222] border border-slate-800 text-slate-300 hover:text-white hover:border-amber-500/30" 
                    : "bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-amber-500/40 shadow-xs"
              }`}
            >
              🔑 Clés & Logiciels
            </button>
            <button
              onClick={() => setSelectedCategory("social")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === "social"
                  ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                  : isDark 
                    ? "bg-[#0d1222] border border-slate-800 text-slate-300 hover:text-white hover:border-amber-500/30" 
                    : "bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-amber-500/40 shadow-xs"
              }`}
            >
              🚀 Boost Réseaux
            </button>
          </div>

          <div className={`text-xs font-mono ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {filteredProducts.length} produit(s) disponible(s)
          </div>
        </div>

        {/* PRODUCTS GRID */}
        {loadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div 
                key={index}
                className={`rounded-2xl border p-5 flex flex-col justify-between shadow-sm animate-pulse relative overflow-hidden ${
                  isDark ? "bg-[#0d1222] border-slate-800" : "bg-white border-slate-200"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className={`h-5 w-24 rounded-full ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
                    <div className={`h-5 w-20 rounded-full ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
                  </div>

                  <div className="flex items-start gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl shrink-0 ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
                    <div className="space-y-2 flex-1">
                      <div className={`h-4 w-3/4 rounded ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
                      <div className={`h-3 w-1/2 rounded ${isDark ? "bg-slate-800/60" : "bg-slate-200/70"}`} />
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className={`h-3 w-full rounded ${isDark ? "bg-slate-800/60" : "bg-slate-200/70"}`} />
                    <div className={`h-3 w-4/5 rounded ${isDark ? "bg-slate-800/60" : "bg-slate-200/70"}`} />
                  </div>
                </div>

                <div className={`pt-3 border-t mt-auto ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                  <div className="grid grid-cols-2 gap-2">
                    <div className={`h-9 rounded-xl ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
                    <div className={`h-9 rounded-xl ${isDark ? "bg-amber-500/20" : "bg-amber-100"}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className={`py-16 text-center rounded-2xl border p-8 ${
            isDark ? "bg-[#0d1222] border-slate-800" : "bg-white border-slate-200 shadow-sm"
          }`}>
            <Search className={`w-12 h-12 mx-auto mb-3 ${isDark ? "text-slate-600" : "text-slate-400"}`} />
            <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Aucun produit trouvé</h3>
            <p className={`text-xs mt-1 max-w-sm mx-auto ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Essayez de modifier votre recherche ou de changer de catégorie.
            </p>
            <button
              onClick={() => { setSelectedCategory("all"); setSearchQuery(""); }}
              className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-semibold hover:bg-amber-600 transition-all cursor-pointer shadow-sm"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className={`group relative rounded-2xl border p-5 flex flex-col justify-between shadow-sm transition-all overflow-hidden ${
                  isDark 
                    ? "bg-[#0d1222] border-slate-800 hover:border-amber-500/50 hover:ring-2 hover:ring-amber-500/20" 
                    : "bg-white border-slate-200 hover:border-amber-500 hover:ring-2 hover:ring-amber-500/20 shadow-xs"
                }`}
              >
                <div>
                  {/* Top Header: Badge & Stock */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {product.badge ? (
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-extrabold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-500" />
                        {product.badge}
                      </span>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono flex items-center gap-1 border ${
                        isDark 
                          ? "bg-slate-900 border-slate-800 text-slate-300" 
                          : "bg-slate-50 border-slate-200 text-slate-600"
                      }`}>
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        {product.durationOrType}
                      </span>
                    )}

                    {product.stockStatus === "low_stock" ? (
                      <span className="text-[10px] font-extrabold font-mono px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                        Stock Limité
                      </span>
                    ) : product.stockStatus === "in_stock" ? (
                      <span className="text-[10px] font-semibold font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        En stock
                      </span>
                    ) : (
                      <span className={`text-[10px] font-semibold font-mono px-2 py-0.5 rounded-full border ${
                        isDark ? "bg-slate-800 text-slate-400 border-slate-700" : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}>
                        Rupture
                      </span>
                    )}
                  </div>

                  {/* Title & Icon */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${
                      isDark 
                        ? "bg-slate-900/90 border-slate-800 group-hover:border-amber-500/40" 
                        : "bg-slate-50 border-slate-200 group-hover:border-amber-500/40"
                    }`}>
                      {renderIcon(product.iconName)}
                    </div>
                    <div>
                      <h3 className={`text-base font-bold transition-colors line-clamp-1 ${
                        isDark ? "text-white group-hover:text-amber-400" : "text-slate-900 group-hover:text-amber-600"
                      }`}>
                        {product.title}
                      </h3>
                      <p className="text-[11px] font-mono text-amber-500 mt-0.5 font-medium">
                        {product.durationOrType}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className={`text-xs mb-4 line-clamp-2 leading-relaxed ${
                    isDark ? "text-slate-400" : "text-slate-600"
                  }`}>
                    {product.description}
                  </p>

                  {/* Features list */}
                  {product.features && product.features.length > 0 && (
                    <ul className={`space-y-1.5 mb-5 border-t pt-3 ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                      {product.features.map((feat, idx) => (
                        <li key={idx} className={`flex items-center gap-1.5 text-[11px] ${
                          isDark ? "text-slate-300" : "text-slate-700"
                        }`}>
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="line-clamp-1">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Footer Price & Actions */}
                <div className={`pt-3 border-t mt-auto ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                  <div className="flex items-baseline justify-between mb-4">
                    <div>
                      <span className={`text-[10px] font-mono flex items-center gap-1 ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`}>
                        <span>{selectedCountry.flag}</span>
                        <span>Tarif {selectedCountry.name}</span>
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-xl font-black font-display ${
                          isDark ? "text-white" : "text-slate-900"
                        }`}>
                          {formatPriceValue(
                            getProductPriceForRegion(product, selectedCountry.region),
                            selectedCountry.currencySymbol,
                            selectedCountry.currency
                          )}
                        </span>
                        {getOriginalPriceForRegion(product, selectedCountry.region) && (
                          <span className="text-xs text-slate-400 line-through font-mono">
                            {formatPriceValue(
                              getOriginalPriceForRegion(product, selectedCountry.region)!,
                              selectedCountry.currencySymbol,
                              selectedCountry.currency
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      Livraison 5 min
                    </span>
                  </div>

                  {/* Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => addToCart(product)}
                      className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                        isDark 
                          ? "bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200" 
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-500" />
                      Panier
                    </button>
                    <button
                      onClick={() => buyNow(product)}
                      className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-xs font-bold text-white shadow-sm flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
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
      <section className={`py-16 border-y relative z-10 overflow-hidden transition-colors ${
        isDark ? "bg-[#080b12] border-slate-800/80" : "bg-slate-100/70 border-slate-200"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500 font-medium mb-3">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>4.9 / 5 sur +1,200 Avis Vérifiés</span>
          </div>
          <h2 className={`text-2xl font-bold font-display ${isDark ? "text-white" : "text-slate-900"}`}>
            Ce que disent nos clients
          </h2>
        </div>

        {/* Marquee Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto px-4">
          <div className={`p-5 rounded-2xl border relative transition-colors ${
            isDark ? "bg-[#0d1222] border-slate-800" : "bg-white border-slate-200 shadow-xs"
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <span className="text-[10px] text-emerald-500 font-mono flex items-center gap-1 font-semibold">
                <CheckCircle className="w-3 h-3" /> Achat Vérifié
              </span>
            </div>
            <p className={`text-xs italic mb-4 leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              "Abonnement Netflix 4K activé en moins de 3 minutes sur mon compte. Qualité vidéo parfaite sans aucune déconnexion."
            </p>
            <div className={`flex items-center justify-between text-xs pt-3 border-t ${
              isDark ? "border-slate-800" : "border-slate-100"
            }`}>
              <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Marc D.</span>
              <span className="text-slate-400 text-[10px]">Netflix 4K • Hier</span>
            </div>
          </div>

          <div className={`p-5 rounded-2xl border relative transition-colors ${
            isDark ? "bg-[#0d1222] border-slate-800" : "bg-white border-slate-200 shadow-xs"
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <span className="text-[10px] text-emerald-500 font-mono flex items-center gap-1 font-semibold">
                <CheckCircle className="w-3 h-3" /> Achat Vérifié
              </span>
            </div>
            <p className={`text-xs italic mb-4 leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              "Clé Windows 11 Pro activée instantanément sur le site officiel Microsoft. Prix imbattable et support WhatsApp très aimable."
            </p>
            <div className={`flex items-center justify-between text-xs pt-3 border-t ${
              isDark ? "border-slate-800" : "border-slate-100"
            }`}>
              <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Sami K.</span>
              <span className="text-slate-400 text-[10px]">Windows 11 Pro • Il y a 2 jours</span>
            </div>
          </div>

          <div className={`p-5 rounded-2xl border relative transition-colors ${
            isDark ? "bg-[#0d1222] border-slate-800" : "bg-white border-slate-200 shadow-xs"
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <span className="text-[10px] text-emerald-500 font-mono flex items-center gap-1 font-semibold">
                <CheckCircle className="w-3 h-3" /> Achat Vérifié
              </span>
            </div>
            <p className={`text-xs italic mb-4 leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              "Boost de 1000 abonnés TikTok livré progressivement dans la soirée. Mon profil est maintenant crédible pour mes lives !"
            </p>
            <div className={`flex items-center justify-between text-xs pt-3 border-t ${
              isDark ? "border-slate-800" : "border-slate-100"
            }`}>
              <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Élodie B.</span>
              <span className="text-slate-400 text-[10px]">Boost TikTok • Il y a 3 jours</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ ACCORDION SECTION */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto z-10 relative">
        <div className="text-center mb-10">
          <h2 className={`text-2xl font-bold font-display mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
            Foire Aux Questions (FAQ)
          </h2>
          <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Tout ce qu'il faut savoir avant de commander
          </p>
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
              className={`rounded-xl border overflow-hidden transition-colors ${
                isDark ? "bg-[#0d1222] border-slate-800" : "bg-white border-slate-200 shadow-xs"
              }`}
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className={`w-full p-4 text-left font-semibold text-sm flex items-center justify-between transition-colors cursor-pointer ${
                  isDark ? "text-white hover:text-amber-400" : "text-slate-900 hover:text-amber-600"
                }`}
              >
                <span className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  {faq.q}
                </span>
                <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === idx ? "rotate-90 text-amber-500" : ""}`} />
              </button>
              {openFaq === idx && (
                <div className={`px-4 pb-4 pt-1 text-xs leading-relaxed border-t ${
                  isDark ? "text-slate-400 border-slate-800" : "text-slate-600 border-slate-100"
                }`}>
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
          <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`w-full max-w-md h-full flex flex-col justify-between shadow-2xl relative z-10 border-l ${
                isDark ? "bg-[#0d1222] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
              }`}
            >
              
              {/* Header */}
              <div className={`p-5 border-b flex items-center justify-between ${
                isDark ? "bg-[#0a0d16] border-slate-800" : "bg-slate-50 border-slate-200"
              }`}>
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-500" />
                  <h3 className={`font-bold text-base ${isDark ? "text-white" : "text-slate-900"}`}>
                    Votre Panier ({cartCount})
                  </h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${
                    isDark ? "hover:bg-slate-800 text-slate-400 hover:text-white" : "hover:bg-slate-200 text-slate-500 hover:text-slate-900"
                  }`}
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
                        <ShoppingBag className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                        <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Votre panier est actuellement vide.</p>
                        <button
                          onClick={() => setIsCartOpen(false)}
                          className="mt-4 px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-all cursor-pointer shadow-sm"
                        >
                          Découvrir les produits
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {cart.map((item) => (
                          <div
                            key={item.product.id}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                              isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
                                isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                              }`}>
                                {renderIcon(item.product.iconName)}
                              </div>
                              <div className="min-w-0">
                                <h4 className={`text-xs font-bold truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                                  {item.product.title}
                                </h4>
                                <p className="text-[10px] text-amber-500 font-mono font-medium">{item.product.durationOrType}</p>
                                <p className={`text-xs font-bold mt-0.5 ${isDark ? "text-amber-400" : "text-amber-600"}`}>
                                  {formatPriceValue(
                                    getProductPriceForRegion(item.product, selectedCountry.region) * item.quantity,
                                    selectedCountry.currencySymbol,
                                    selectedCountry.currency
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className={`flex items-center border rounded-lg ${
                                isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"
                              }`}>
                                <button
                                  onClick={() => updateQuantity(item.product.id, -1)}
                                  className={`p-1 rounded-l-lg cursor-pointer ${
                                    isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className={`px-2 text-xs font-mono font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.product.id, 1)}
                                  className={`p-1 rounded-r-lg cursor-pointer ${
                                    isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              <button
                                onClick={() => removeFromCart(item.product.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
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
                    <div className={`flex items-center justify-between pb-2 border-b ${
                      isDark ? "border-slate-800" : "border-slate-200"
                    }`}>
                      <span className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                        Coordonnées de livraison
                      </span>
                      <button
                        type="button"
                        onClick={() => setCheckoutStep("cart")}
                        className="text-xs text-amber-500 hover:underline cursor-pointer"
                      >
                        ← Retour au panier
                      </button>
                    </div>

                    {orderError && (
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                        {orderError}
                      </div>
                    )}

                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                        Nom complet *
                      </label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Ex: Jean Dupont"
                        className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 ${
                          isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                        E-mail de livraison *
                      </label>
                      <input
                        type="email"
                        required
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="votre-email@domaine.com"
                        className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 ${
                          isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                        Numéro WhatsApp (avec indicatif) *
                      </label>
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+33 6 12 34 56 78"
                        className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 ${
                          isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
                        }`}
                      />
                      <p className={`text-[10px] mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                        Utilisé pour l'envoi direct de vos accès par message.
                      </p>
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                        Moyen de paiement
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: "card", label: "Carte Bancaire", icon: CreditCard },
                          { id: "crypto", label: "Crypto (USDT/BTC)", icon: Zap },
                          { id: "paypal", label: "PayPal", icon: Lock },
                          { id: "mobile_money", label: "Mobile Money", icon: Smartphone }
                        ].map((pm) => {
                          const IconComp = pm.icon;
                          const isSelected = paymentMethod === pm.id;
                          return (
                            <button
                              key={pm.id}
                              type="button"
                              onClick={() => setPaymentMethod(pm.id as any)}
                              className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-amber-500/15 border-amber-500 text-amber-500 font-bold"
                                  : isDark 
                                    ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-white" 
                                    : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900"
                              }`}
                            >
                              <IconComp className="w-4 h-4 text-amber-500 shrink-0" />
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
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500 mx-auto">
                      <CheckCircle className="w-8 h-8" />
                    </div>
                    <h3 className={`text-xl font-bold font-display ${isDark ? "text-white" : "text-slate-900"}`}>
                      Commande Validée !
                    </h3>
                    <p className={`text-xs leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                      Merci <span className="font-semibold text-amber-500">{completedOrder.customerName}</span> ! <br />
                      Votre commande <span className="font-mono text-amber-500 font-semibold">#{completedOrder.id.slice(0, 8)}</span> a été traitée.
                    </p>
                    <div className={`p-4 rounded-xl border text-left text-xs space-y-2 ${
                      isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"
                    }`}>
                      <p className={isDark ? "text-slate-400" : "text-slate-600"}>
                        📩 <strong className={isDark ? "text-white" : "text-slate-900"}>Email:</strong> {completedOrder.customerEmail}
                      </p>
                      <p className={isDark ? "text-slate-400" : "text-slate-600"}>
                        📱 <strong className={isDark ? "text-white" : "text-slate-900"}>WhatsApp:</strong> {completedOrder.customerPhone}
                      </p>
                      <p className={isDark ? "text-slate-400" : "text-slate-600"}>
                        💳 <strong className={isDark ? "text-white" : "text-slate-900"}>Total réglé:</strong> {formatPriceValue(completedOrder.totalAmount, completedOrder.currencySymbol || selectedCountry.currencySymbol, completedOrder.currency || selectedCountry.currency)}
                      </p>
                    </div>
                    <p className="text-[11px] text-amber-500 font-mono font-medium">
                      Vos identifiants et accès vous sont transmis par WhatsApp sous quelques minutes.
                    </p>
                    <button
                      onClick={() => {
                        setCheckoutStep("cart");
                        setIsCartOpen(false);
                      }}
                      className="w-full py-3 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition-all shadow-md cursor-pointer"
                    >
                      Retour à la boutique
                    </button>
                  </div>
                )}

              </div>

              {/* Drawer Footer Total & Proceed */}
              {cart.length > 0 && checkoutStep !== "success" && (
                <div className={`p-5 border-t space-y-3 ${
                  isDark ? "bg-[#0a0d16] border-slate-800" : "bg-slate-50 border-slate-200"
                }`}>
                  <div className="flex items-center justify-between text-sm">
                    <span className={isDark ? "text-slate-400" : "text-slate-600"}>Total à payer</span>
                    <span className={`text-xl font-black font-display ${isDark ? "text-white" : "text-slate-900"}`}>
                      {formatPriceValue(cartTotal, selectedCountry.currencySymbol, selectedCountry.currency)}
                    </span>
                  </div>

                  {checkoutStep === "cart" ? (
                    <button
                      onClick={() => setCheckoutStep("form")}
                      className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      Passer la commande ({formatPriceValue(cartTotal, selectedCountry.currencySymbol, selectedCountry.currency)})
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleCheckoutSubmit}
                      disabled={isSubmitting}
                      className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={`w-full max-w-lg rounded-2xl p-6 shadow-2xl relative overflow-hidden border ${
                isDark ? "bg-[#0d1222] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
              }`}
            >
              <div className={`flex items-center justify-between pb-4 border-b mb-4 ${
                isDark ? "border-slate-800" : "border-slate-200"
              }`}>
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-amber-500" />
                  <div>
                    <h3 className={`font-bold text-base font-display ${isDark ? "text-white" : "text-slate-900"}`}>
                      Pays & Devise de la Boutique
                    </h3>
                    <p className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      Détection automatique : <span className="text-amber-500 font-semibold">{selectedCountry.flag} {selectedCountry.name} ({selectedCountry.symbol})</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCountryModalOpen(false)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isDark ? "hover:bg-slate-800 text-slate-400 hover:text-white" : "hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                  }`}
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
                  className={`w-full pl-9 pr-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-amber-500 ${
                    isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                  }`}
                />
              </div>

              {/* Country Grid */}
              <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                {COUNTRIES
                  .filter(c => c.name.toLowerCase().includes(countrySearchQuery.toLowerCase()) || c.code.toLowerCase().includes(countrySearchQuery.toLowerCase()) || c.currency.toLowerCase().includes(countrySearchQuery.toLowerCase()))
                  .map(country => {
                    const isSelected = selectedCountry.code === country.code;
                    return (
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
                          isSelected
                            ? "bg-amber-500/15 border-amber-500 text-amber-500 font-bold"
                            : isDark
                              ? "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white"
                              : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{country.flag}</span>
                          <div>
                            <p className="text-xs font-semibold">{country.name}</p>
                            <p className={`text-[10px] font-mono ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                              Région : {country.region.toUpperCase()}
                            </p>
                          </div>
                        </div>
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                          isSelected 
                            ? "text-amber-500 bg-amber-500/10 border-amber-500/30"
                            : isDark
                              ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                              : "text-amber-600 bg-amber-50 border-amber-200"
                        }`}>
                          {country.currency} ({country.symbol})
                        </span>
                      </button>
                    );
                  })}
              </div>

              <div className={`mt-4 pt-3 border-t text-center ${isDark ? "border-slate-800" : "border-slate-200"}`}>
                <button
                  onClick={() => setIsCountryModalOpen(false)}
                  className={`px-4 py-2 border text-xs rounded-xl transition-all cursor-pointer ${
                    isDark ? "bg-slate-900 border-slate-800 text-slate-300 hover:text-white" : "bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900"
                  }`}
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
              className={`pointer-events-auto p-4 rounded-2xl shadow-xl flex items-start justify-between gap-3 border ${
                isDark 
                  ? "bg-[#0d1222]/95 border-amber-500/40 text-white backdrop-blur-xl" 
                  : "bg-white border-amber-400 text-slate-900 shadow-amber-500/5 backdrop-blur-xl"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500 shrink-0 mt-0.5 shadow-xs">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className={`text-xs font-bold font-display ${isDark ? "text-white" : "text-slate-900"}`}>
                    {toast.title}
                  </h4>
                  {toast.description && (
                    <p className={`text-[11px] mt-0.5 leading-snug ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                      {toast.description}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className={`p-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
                  isDark ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                }`}
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
