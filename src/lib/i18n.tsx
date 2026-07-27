import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "fr" | "en" | "de" | "es";
export type Theme = "dark" | "light";

export interface LanguageOption {
  code: Language;
  name: string;
  flag: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "es", name: "Español", flag: "🇪🇸" }
];

export const translations = {
  fr: {
    // Nav & Common
    quality_badge: "Qualité UHD & 4K • Serveurs Premium Actifs",
    tagline: "Accédez à vos chaînes favorites, sports en direct et VOD en qualité exceptionnelle, sans coupure.",
    client_portal: "Portail Client",
    buy_subscription: "Acheter un abonnement",
    admin_space: "Espace Admin",
    home: "Accueil",
    back_to_portal: "Retour au Portail Client",
    dark_mode: "Mode Sombre",
    light_mode: "Mode Clair",
    copyright: "POWER IPTV • Service de Streaming Haute Stabilité & Qualité Premium",
    server_active: "ACTIF (HTTPS)",
    gateway_proxy: "Passerelle IPTV Proxy :",

    // Login Page
    client_portal_title: "Connexion Portail Client",
    client_portal_sub: "Entrez vos identifiants IPTV pour lancer votre lecteur HD/4K",
    username_label: "Nom d'utilisateur",
    username_placeholder: "Ex: iptv_user123",
    password_label: "Mot de passe",
    password_placeholder: "Votre mot de passe",
    remember_me: "Se souvenir de moi",
    connect_button: "Connexion au Lecteur",
    authenticating: "Authentification...",
    launching_stream: "Lancement du flux HD...",
    marketplace_banner_title: "Besoin d'un abonnement ou d'une recharge ?",
    marketplace_banner_desc: "Achetez vos accès instantanés 12 ou 24 mois sur notre Marketplace Partenaire au meilleur prix du marché.",
    buy_now: "Acheter un abonnement",
    feature_stable: "Serveurs Stables",
    feature_stable_desc: "Uptime de 99.9% avec ré-acheminement automatique du flux",
    feature_quality: "Qualité 4K & VOD",
    feature_quality_desc: "Des milliers de chaînes en direct et films régulièrement mis à jour",
    feature_secure: "Connexion Sécurisée",
    feature_secure_desc: "Chiffrement AES-256 de bout en bout pour vos accès",
    quick_reconnect: "Restauration Rapide",
    reconnect_as: "Se reconnecter en tant que",
    reconnect_button: "Relancer le Lecteur",

    // Store Page
    store_title: "Marketplace Numérique",
    store_subtitle: "Abonnements IPTV Premium, Clés de logiciels et VOD avec livraison instantanée",
    search_placeholder: "Rechercher un abonnement, produit, VOD...",
    all_products: "Tous les produits",
    cat_streaming: "Streaming & IPTV",
    cat_software: "Logiciels & Clés",
    cat_social: "Services & Boost",
    in_stock: "En stock",
    low_stock: "Stock Limité",
    out_of_stock: "Rupture",
    add_to_cart: "Ajouter au panier",
    cart: "Panier",
    empty_cart: "Votre panier est vide",
    empty_cart_desc: "Découvrez nos abonnements IPTV et produits digitaux ci-dessous.",
    subtotal: "Sous-total",
    checkout: "Commander maintenant",
    order_title: "Validation de votre commande",
    full_name: "Nom complet",
    email: "Adresse E-mail",
    phone_whatsapp: "Numéro WhatsApp / Téléphone",
    payment_method: "Moyen de paiement",
    card_payment: "Carte Bancaire / Crypto",
    paypal_payment: "PayPal / Virement",
    confirm_order: "Valider la commande",
    processing_order: "Traitement de votre commande...",
    order_success: "Commande Validée !",
    order_success_desc: "Votre commande est enregistrée. Nos équipes préparent vos identifiants d'accès.",
    toast_added: "Produit ajouté au panier !",
    toast_order_success: "Commande validée avec succès !",

    // IPTV Player
    player_title: "POWER IPTV Player 4K",
    connected_as: "Connecté :",
    expires_in: "Expire le :",
    session_expired: "Session expirée",
    close_player: "Fermer le lecteur",
    fullscreen: "Plein écran",
    channel_list: "Chaînes & Catégories",
    search_channel: "Rechercher une chaîne...",
    server_online: "Serveur en ligne",
    buffering: "Chargement du flux vidéo...",

    // FAQ Section
    faq_title: "Foire Aux Questions (FAQ)",
    faq_subtitle: "Tout ce que vous devez savoir sur nos services IPTV & abonnements",
    faq_q1: "Comment fonctionnent les accès IPTV ?",
    faq_a1: "Une fois connecté avec vos identifiants, notre passerelle sécurisée charge vos chaînes HD/4K directement sur votre écran, smartphone, Smart TV ou PC sans matériel supplémentaire.",
    faq_q2: "Quels appareils sont compatibles ?",
    faq_a2: "Compatible avec Smart TV (Samsung, LG, Android TV), Firestick, Boîtiers Android, iOS/iPhone, Windows, Mac, MAG et Formuler.",
    faq_q3: "Quelle connexion internet est requise ?",
    faq_a3: "Une connexion stable de 10 Mbps est recommandée pour les chaînes HD, et 25 Mbps pour le contenu 4K Ultra HD.",
    faq_q4: "Comment recevoir mes identifiants après achat ?",
    faq_a4: "Après validation de votre commande sur notre store, vos identifiants vous sont transmis instantanément par e-mail et WhatsApp.",

    // Support
    support_title: "Besoin d'aide ?",
    support_subtitle: "Contactez le support client ou envoyez un ticket",
    send_ticket: "Envoyer un ticket support",
    message_label: "Votre message",
    ticket_sent: "Ticket envoyé avec succès !",
    ticket_sent_desc: "Un agent va examiner votre demande rapidement.",

    // Admin
    admin_login_title: "Espace d'Administration",
    admin_login_sub: "Accès restreint aux gestionnaires de comptes IPTV",
    dashboard: "Tableau de bord",
    manage_users: "Gestion Clients",
    manage_admins: "Gestion Admins",
    manage_tickets: "Tickets Support",
    manage_store: "Produits Store",
    manage_orders: "Commandes Store",
    audit_logs: "Journal d'Audit",
    create_user: "Créer un utilisateur IPTV",
    create_admin: "Créer un administrateur",
    create_product: "Ajouter un produit",
  },

  en: {
    // Nav & Common
    quality_badge: "UHD & 4K Quality • Active Premium Servers",
    tagline: "Access your favorite channels, live sports, and VOD in exceptional quality, smoothly without buffering.",
    client_portal: "Client Portal",
    buy_subscription: "Buy Subscription",
    admin_space: "Admin Area",
    home: "Home",
    back_to_portal: "Back to Client Portal",
    dark_mode: "Dark Mode",
    light_mode: "Light Mode",
    copyright: "POWER IPTV • High Stability & Premium Quality Streaming Service",
    server_active: "ACTIVE (HTTPS)",
    gateway_proxy: "IPTV Gateway Proxy Core:",

    // Login Page
    client_portal_title: "Client Portal Login",
    client_portal_sub: "Enter your IPTV credentials to launch your HD/4K player",
    username_label: "Username",
    username_placeholder: "Ex: iptv_user123",
    password_label: "Password",
    password_placeholder: "Your password",
    remember_me: "Remember me",
    connect_button: "Connect to Player",
    authenticating: "Authenticating...",
    launching_stream: "Launching HD stream...",
    marketplace_banner_title: "Need a subscription or renewal?",
    marketplace_banner_desc: "Buy 12 or 24-month instant access on our Partner Marketplace at the best market price.",
    buy_now: "Buy Subscription",
    feature_stable: "Stable Servers",
    feature_stable_desc: "99.9% uptime with automatic stream failover rerouting",
    feature_quality: "4K & VOD Quality",
    feature_quality_desc: "Thousands of live channels and frequently updated movies",
    feature_secure: "Secure Connection",
    feature_secure_desc: "End-to-end AES-256 encryption for your access",
    quick_reconnect: "Quick Restore",
    reconnect_as: "Reconnect as",
    reconnect_button: "Relaunch Player",

    // Store Page
    store_title: "Digital Marketplace",
    store_subtitle: "Premium IPTV Subscriptions, Software Keys and VOD with instant delivery",
    search_placeholder: "Search subscription, product, VOD...",
    all_products: "All Products",
    cat_streaming: "Streaming & IPTV",
    cat_software: "Software & Keys",
    cat_social: "Services & Boost",
    in_stock: "In Stock",
    low_stock: "Limited Stock",
    out_of_stock: "Out of Stock",
    add_to_cart: "Add to Cart",
    cart: "Cart",
    empty_cart: "Your cart is empty",
    empty_cart_desc: "Explore our IPTV subscriptions and digital products below.",
    subtotal: "Subtotal",
    checkout: "Checkout Now",
    order_title: "Order Checkout",
    full_name: "Full Name",
    email: "Email Address",
    phone_whatsapp: "WhatsApp / Phone Number",
    payment_method: "Payment Method",
    card_payment: "Credit Card / Crypto",
    paypal_payment: "PayPal / Transfer",
    confirm_order: "Confirm Order",
    processing_order: "Processing your order...",
    order_success: "Order Confirmed!",
    order_success_desc: "Your order is saved. Our team is preparing your access credentials.",
    toast_added: "Product added to cart!",
    toast_order_success: "Order successfully confirmed!",

    // IPTV Player
    player_title: "POWER IPTV Player 4K",
    connected_as: "Connected as:",
    expires_in: "Expires on:",
    session_expired: "Session Expired",
    close_player: "Close Player",
    fullscreen: "Fullscreen",
    channel_list: "Channels & Categories",
    search_channel: "Search channel...",
    server_online: "Server Online",
    buffering: "Loading video stream...",

    // FAQ Section
    faq_title: "Frequently Asked Questions (FAQ)",
    faq_subtitle: "Everything you need to know about our IPTV services & subscriptions",
    faq_q1: "How do IPTV accesses work?",
    faq_a1: "Once logged in with your credentials, our secure gateway loads your HD/4K channels directly onto your screen, smartphone, Smart TV, or PC without additional hardware.",
    faq_q2: "Which devices are compatible?",
    faq_a2: "Compatible with Smart TVs (Samsung, LG, Android TV), Firestick, Android boxes, iOS/iPhone, Windows, Mac, MAG, and Formuler.",
    faq_q3: "What internet speed is required?",
    faq_a3: "A stable 10 Mbps connection is recommended for HD channels, and 25 Mbps for 4K Ultra HD content.",
    faq_q4: "How do I receive my credentials after purchase?",
    faq_a4: "After validating your order on our store, your credentials are sent instantly to you via email and WhatsApp.",

    // Support
    support_title: "Need Help?",
    support_subtitle: "Contact customer support or submit a ticket",
    send_ticket: "Send Support Ticket",
    message_label: "Your Message",
    ticket_sent: "Ticket Sent Successfully!",
    ticket_sent_desc: "An agent will review your request shortly.",

    // Admin
    admin_login_title: "Administration Panel",
    admin_login_sub: "Restricted access for IPTV account managers",
    dashboard: "Dashboard",
    manage_users: "Client Management",
    manage_admins: "Admin Management",
    manage_tickets: "Support Tickets",
    manage_store: "Store Products",
    manage_orders: "Store Orders",
    audit_logs: "Audit Logs",
    create_user: "Create IPTV User",
    create_admin: "Create Admin",
    create_product: "Add Product",
  },

  de: {
    // Nav & Common
    quality_badge: "UHD & 4K Qualität • Aktive Premium-Server",
    tagline: "Greifen Sie ohne Unterbrechung auf Ihre Lieblingssender, Live-Sport und VOD in hervorragender Qualität zu.",
    client_portal: "Kundenportal",
    buy_subscription: "Abonnement kaufen",
    admin_space: "Admin-Bereich",
    home: "Startseite",
    back_to_portal: "Zurück zum Kundenportal",
    dark_mode: "Dunkler Modus",
    light_mode: "Heller Modus",
    copyright: "POWER IPTV • Hochstabiler & Premium-Qualitäts-Streaming-Dienst",
    server_active: "AKTIV (HTTPS)",
    gateway_proxy: "IPTV Gateway Proxy Core:",

    // Login Page
    client_portal_title: "Kundenportal Anmeldung",
    client_portal_sub: "Geben Sie Ihre IPTV-Zugangsdaten ein, um den HD/4K-Player zu starten",
    username_label: "Benutzername",
    username_placeholder: "z.B. iptv_user123",
    password_label: "Passwort",
    password_placeholder: "Ihr Passwort",
    remember_me: "Angemeldet bleiben",
    connect_button: "Mit Player verbinden",
    authenticating: "Authentifizierung...",
    launching_stream: "HD-Stream wird gestartet...",
    marketplace_banner_title: "Benötigen Sie ein Abo oder eine Aufladung?",
    marketplace_banner_desc: "Kaufen Sie 12 oder 24 Monate Sofortzugang auf unserem Partner-Marktplatz zum besten Preis.",
    buy_now: "Abonnement kaufen",
    feature_stable: "Stabile Server",
    feature_stable_desc: "99.9% Betriebszeit mit automatischer Stream-Umleitung",
    feature_quality: "4K & VOD Qualität",
    feature_quality_desc: "Tausende Live-Kanäle und regelmäßig aktualisierte Filme",
    feature_secure: "Sichere Verbindung",
    feature_secure_desc: "Ende-zu-Ende AES-256-Verschlüsselung für Ihren Zugriff",
    quick_reconnect: "Schnellwiederherstellung",
    reconnect_as: "Wiederverbinden als",
    reconnect_button: "Player neu starten",

    // Store Page
    store_title: "Digitaler Marktplatz",
    store_subtitle: "Premium IPTV-Abonnements, Software-Schlüssel und VOD mit Sofortlieferung",
    search_placeholder: "Abo, Produkt, VOD suchen...",
    all_products: "Alle Produkte",
    cat_streaming: "Streaming & IPTV",
    cat_software: "Software & Keys",
    cat_social: "Dienste & Boost",
    in_stock: "Auf Lager",
    low_stock: "Begrenzter Vorrat",
    out_of_stock: "Ausverkauft",
    add_to_cart: "In den Warenkorb",
    cart: "Warenkorb",
    empty_cart: "Ihr Warenkorb ist leer",
    empty_cart_desc: "Entdecken Sie unten unsere IPTV-Abonnements und digitalen Produkte.",
    subtotal: "Zwischensumme",
    checkout: "Jetzt bestellen",
    order_title: "Bestellbestätigung",
    full_name: "Vollständiger Name",
    email: "E-Mail-Adresse",
    phone_whatsapp: "WhatsApp / Telefonnummer",
    payment_method: "Zahlungsmethode",
    card_payment: "Kreditkarte / Krypto",
    paypal_payment: "PayPal / Überweisung",
    confirm_order: "Bestellung bestätigen",
    processing_order: "Ihre Bestellung wird bearbeitet...",
    order_success: "Bestellung bestätigt!",
    order_success_desc: "Ihre Bestellung wurde gespeichert. Unser Team bereitet Ihre Zugangsdaten vor.",
    toast_added: "Produkt zum Warenkorb hinzugefügt!",
    toast_order_success: "Bestellung erfolgreich abgeschlossen!",

    // IPTV Player
    player_title: "POWER IPTV Player 4K",
    connected_as: "Angemeldet als:",
    expires_in: "Gültig bis:",
    session_expired: "Sitzung abgelaufen",
    close_player: "Player schließen",
    fullscreen: "Vollbild",
    channel_list: "Kanäle & Kategorien",
    search_channel: "Kanal suchen...",
    server_online: "Server online",
    buffering: "Videostream wird geladen...",

    // FAQ Section
    faq_title: "Häufig gestellte Fragen (FAQ)",
    faq_subtitle: "Alles, was Sie über unsere IPTV-Dienste & Abonnements wissen müssen",
    faq_q1: "Wie funktionieren IPTV-Zugänge?",
    faq_a1: "Nach der Anmeldung mit Ihren Zugangsdaten lädt unser sicheres Gateway Ihre HD/4K-Kanäle direkt auf Ihren Bildschirm, Ihr Smartphone, Ihren Smart TV oder PC ohne zusätzliche Hardware.",
    faq_q2: "Welche Geräte sind kompatibel?",
    faq_a2: "Kompatibel mit Smart TVs (Samsung, LG, Android TV), Firestick, Android-Boxen, iOS/iPhone, Windows, Mac, MAG und Formuler.",
    faq_q3: "Welche Internetgeschwindigkeit ist erforderlich?",
    faq_a3: "Eine stabile Verbindung von 10 Mbps wird für HD-Kanäle empfohlen, und 25 Mbps für 4K Ultra HD-Inhalte.",
    faq_q4: "Wie erhalte ich meine Zugangsdaten nach dem Kauf?",
    faq_a4: "Nach der Bestätigung Ihrer Bestellung in unserem Shop werden Ihre Zugangsdaten sofort per E-Mail und WhatsApp an Sie gesendet.",

    // Support
    support_title: "Brauchen Sie Hilfe?",
    support_subtitle: "Kontaktieren Sie den Kundensupport oder senden Sie ein Ticket",
    send_ticket: "Support-Ticket senden",
    message_label: "Ihre Nachricht",
    ticket_sent: "Ticket erfolgreich gesendet!",
    ticket_sent_desc: "Ein Mitarbeiter wird Ihre Anfrage in Kürze prüfen.",

    // Admin
    admin_login_title: "Administrationsbereich",
    admin_login_sub: "Eingeschränkter Zugriff für IPTV-Kontoverwalter",
    dashboard: "Dashboard",
    manage_users: "Kundenverwaltung",
    manage_admins: "Admin-Verwaltung",
    manage_tickets: "Support-Tickets",
    manage_store: "Shop-Produkte",
    manage_orders: "Shop-Bestellungen",
    audit_logs: "Audit-Protokolle",
    create_user: "IPTV-Benutzer erstellen",
    create_admin: "Admin erstellen",
    create_product: "Produkt hinzufügen",
  },

  es: {
    // Nav & Common
    quality_badge: "Calidad UHD & 4K • Servidores Premium Activos",
    tagline: "Accede a tus canales favoritos, deportes en directo y VOD con una calidad excepcional y sin interrupciones.",
    client_portal: "Portal de Clientes",
    buy_subscription: "Comprar suscripción",
    admin_space: "Área de Admin",
    home: "Inicio",
    back_to_portal: "Volver al Portal de Clientes",
    dark_mode: "Modo Oscuro",
    light_mode: "Modo Claro",
    copyright: "POWER IPTV • Servicio de Streaming de Alta Estabilidad & Calidad Premium",
    server_active: "ACTIVO (HTTPS)",
    gateway_proxy: "IPTV Gateway Proxy Core:",

    // Login Page
    client_portal_title: "Acceso al Portal de Clientes",
    client_portal_sub: "Introduce tus credenciales de IPTV para iniciar tu reproductor HD/4K",
    username_label: "Nombre de usuario",
    username_placeholder: "Ej: iptv_user123",
    password_label: "Contraseña",
    password_placeholder: "Tu contraseña",
    remember_me: "Recordarme",
    connect_button: "Conectar al Reproductor",
    authenticating: "Autenticando...",
    launching_stream: "Iniciando transmisión HD...",
    marketplace_banner_title: "¿Necesitas una suscripción o recarga?",
    marketplace_banner_desc: "Compra tu acceso instantáneo de 12 o 24 meses en nuestro Marketplace Socio al mejor precio del mercado.",
    buy_now: "Comprar suscripción",
    feature_stable: "Servidores Estables",
    feature_stable_desc: "99.9% de tiempo de actividad con enrutamiento automático de retransmisión",
    feature_quality: "Calidad 4K & VOD",
    feature_quality_desc: "Miles de canales en directo y películas actualizadas con frecuencia",
    feature_secure: "Conexión Segura",
    feature_secure_desc: "Encriptación AES-256 de extremo a extremo para tu acceso",
    quick_reconnect: "Restauración Rápida",
    reconnect_as: "Reconectar como",
    reconnect_button: "Reiniciar Reproductor",

    // Store Page
    store_title: "Marketplace Digital",
    store_subtitle: "Suscripciones IPTV Premium, Claves de software y VOD con entrega instantánea",
    search_placeholder: "Buscar suscripción, producto, VOD...",
    all_products: "Todos los productos",
    cat_streaming: "Streaming & IPTV",
    cat_software: "Software & Claves",
    cat_social: "Servicios & Boost",
    in_stock: "En stock",
    low_stock: "Stock Limitado",
    out_of_stock: "Agotado",
    add_to_cart: "Añadir al carrito",
    cart: "Carrito",
    empty_cart: "Tu carrito está vacío",
    empty_cart_desc: "Descubre nuestras suscripciones IPTV y productos digitales a continuación.",
    subtotal: "Subtotal",
    checkout: "Comprar ahora",
    order_title: "Confirmación de tu pedido",
    full_name: "Nombre completo",
    email: "Correo electrónico",
    phone_whatsapp: "Número de WhatsApp / Teléfono",
    payment_method: "Método de pago",
    card_payment: "Tarjeta de Crédito / Cripto",
    paypal_payment: "PayPal / Transferencia",
    confirm_order: "Confirmar pedido",
    processing_order: "Procesando tu pedido...",
    order_success: "¡Pedido Confirmado!",
    order_success_desc: "Tu pedido está registrado. Nuestro equipo está preparando tus credenciales de acceso.",
    toast_added: "¡Producto añadido al carrito!",
    toast_order_success: "¡Pedido confirmado con éxito!",

    // IPTV Player
    player_title: "POWER IPTV Player 4K",
    connected_as: "Conectado como:",
    expires_in: "Caduca el:",
    session_expired: "Sesión caducada",
    close_player: "Cerrar reproductor",
    fullscreen: "Pantalla completa",
    channel_list: "Canales & Categorías",
    search_channel: "Buscar canal...",
    server_online: "Servidor en línea",
    buffering: "Cargando retransmisión de vídeo...",

    // FAQ Section
    faq_title: "Preguntas Frecuentes (FAQ)",
    faq_subtitle: "Todo lo que necesitas saber sobre nuestros servicios y suscripciones IPTV",
    faq_q1: "¿Cómo funcionan los accesos IPTV?",
    faq_a1: "Una vez conectado con tus credenciales, nuestra pasarela segura carga tus canales HD/4K directamente en tu pantalla, smartphone, Smart TV o PC sin hardware adicional.",
    faq_q2: "¿Qué dispositivos son compatibles?",
    faq_a2: "Compatible con Smart TV (Samsung, LG, Android TV), Firestick, cajas Android, iOS/iPhone, Windows, Mac, MAG y Formuler.",
    faq_q3: "¿Qué velocidad de internet se requiere?",
    faq_a3: "Se recomienda una conexión estable de 10 Mbps para canales HD, y 25 Mbps para contenido 4K Ultra HD.",
    faq_q4: "¿Cómo recibo mis credenciales después de la compra?",
    faq_a4: "Tras confirmar tu pedido en nuestra tienda, tus credenciales se envían al instante por correo electrónico y WhatsApp.",

    // Support
    support_title: "¿Necesitas ayuda?",
    support_subtitle: "Contacta con atención al cliente o envía un ticket",
    send_ticket: "Enviar ticket de soporte",
    message_label: "Tu mensaje",
    ticket_sent: "¡Ticket enviado con éxito!",
    ticket_sent_desc: "Un agente revisará tu solicitud en breve.",

    // Admin
    admin_login_title: "Panel de Administración",
    admin_login_sub: "Acceso restringido para gestores de cuentas IPTV",
    dashboard: "Panel de control",
    manage_users: "Gestión de Clientes",
    manage_admins: "Gestión de Admins",
    manage_tickets: "Tickets de Soporte",
    manage_store: "Productos de Tienda",
    manage_orders: "Pedidos de Tienda",
    audit_logs: "Registros de Auditoría",
    create_user: "Crear usuario IPTV",
    create_admin: "Crear administrador",
    create_product: "Añadir producto",
  }
};

export type TranslationKey = keyof typeof translations.fr;

function detectBrowserLanguage(): Language {
  const saved = localStorage.getItem("app_lang");
  if (saved && (saved === "fr" || saved === "en" || saved === "de" || saved === "es")) {
    return saved;
  }
  const browser = (navigator.language || (navigator as any).userLanguage || "").toLowerCase();
  if (browser.startsWith("de")) return "de";
  if (browser.startsWith("es")) return "es";
  if (browser.startsWith("en")) return "en";
  return "fr";
}

function detectTheme(): Theme {
  const saved = localStorage.getItem("app_theme");
  if (saved === "light" || saved === "dark") return saved;
  return "dark";
}

interface LanguageThemeContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  t: (key: TranslationKey) => string;
  languages: LanguageOption[];
}

const LanguageThemeContext = createContext<LanguageThemeContextType | undefined>(undefined);

export function LanguageThemeProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(detectBrowserLanguage);
  const [theme, setThemeState] = useState<Theme>(detectTheme);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("app_lang", newLang);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("app_theme", newTheme);
  };

  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    }
  }, [theme]);

  const t = (key: TranslationKey): string => {
    const langDict = translations[lang] || translations.fr;
    return langDict[key] || translations.fr[key] || key;
  };

  return (
    <LanguageThemeContext.Provider value={{ lang, setLang, theme, setTheme, t, languages: LANGUAGES }}>
      <div className={theme === "light" ? "light-mode-active" : "dark-mode-active"}>
        {children}
      </div>
    </LanguageThemeContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageThemeContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageThemeProvider");
  }
  return context;
}
