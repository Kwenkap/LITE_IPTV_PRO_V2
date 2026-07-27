import { DigitalProduct } from "../types/store";

export type RegionCode = "eu" | "us" | "africa";

export interface CountryOption {
  code: string;
  name: string;
  flag: string;
  region: RegionCode;
  currency: string;
  symbol: string;
}

export type CountryInfo = CountryOption;

export const COUNTRIES: CountryOption[] = [
  // Europe (EU - €)
  { code: "FR", name: "France", flag: "🇫🇷", region: "eu", currency: "EUR", symbol: "€" },
  { code: "BE", name: "Belgique", flag: "🇧🇪", region: "eu", currency: "EUR", symbol: "€" },
  { code: "CH", name: "Suisse", flag: "🇨🇭", region: "eu", currency: "EUR", symbol: "€" },
  { code: "DE", name: "Allemagne", flag: "🇩🇪", region: "eu", currency: "EUR", symbol: "€" },
  { code: "ES", name: "Espagne", flag: "🇪🇸", region: "eu", currency: "EUR", symbol: "€" },
  { code: "IT", name: "Italie", flag: "🇮🇹", region: "eu", currency: "EUR", symbol: "€" },
  { code: "PT", name: "Portugal", flag: "🇵🇹", region: "eu", currency: "EUR", symbol: "€" },
  { code: "NL", name: "Pays-Bas", flag: "🇳🇱", region: "eu", currency: "EUR", symbol: "€" },
  { code: "GB", name: "Royaume-Uni", flag: "🇬🇧", region: "eu", currency: "EUR", symbol: "€" },
  { code: "EU", name: "Autre Pays (Europe)", flag: "🇪🇺", region: "eu", currency: "EUR", symbol: "€" },

  // USA & Americas / Global (US - $)
  { code: "US", name: "États-Unis", flag: "🇺🇸", region: "us", currency: "USD", symbol: "$" },
  { code: "CA", name: "Canada", flag: "🇨🇦", region: "us", currency: "USD", symbol: "$" },
  { code: "BR", name: "Brésil", flag: "🇧🇷", region: "us", currency: "USD", symbol: "$" },
  { code: "AU", name: "Australie", flag: "🇦🇺", region: "us", currency: "USD", symbol: "$" },
  { code: "INT", name: "Autre Pays (International)", flag: "🌐", region: "us", currency: "USD", symbol: "$" },

  // Afrique (AF - FCFA)
  { code: "CM", name: "Cameroun", flag: "🇨🇲", region: "africa", currency: "FCFA", symbol: "FCFA" },
  { code: "SN", name: "Sénégal", flag: "🇸🇳", region: "africa", currency: "FCFA", symbol: "FCFA" },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", region: "africa", currency: "FCFA", symbol: "FCFA" },
  { code: "GA", name: "Gabon", flag: "🇬🇦", region: "africa", currency: "FCFA", symbol: "FCFA" },
  { code: "CG", name: "Congo", flag: "🇨🇬", region: "africa", currency: "FCFA", symbol: "FCFA" },
  { code: "ML", name: "Mali", flag: "🇲🇱", region: "africa", currency: "FCFA", symbol: "FCFA" },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫", region: "africa", currency: "FCFA", symbol: "FCFA" },
  { code: "TG", name: "Togo", flag: "🇹🇬", region: "africa", currency: "FCFA", symbol: "FCFA" },
  { code: "BJ", name: "Bénin", flag: "🇧🇯", region: "africa", currency: "FCFA", symbol: "FCFA" },
  { code: "MA", name: "Maroc", flag: "🇲🇦", region: "africa", currency: "FCFA", symbol: "FCFA" },
  { code: "DZ", name: "Algérie", flag: "🇩🇿", region: "africa", currency: "FCFA", symbol: "FCFA" },
  { code: "TN", name: "Tunisie", flag: "🇹🇳", region: "africa", currency: "FCFA", symbol: "FCFA" },
  { code: "NG", name: "Nigéria", flag: "🇳🇬", region: "africa", currency: "FCFA", symbol: "FCFA" },
  { code: "AFR", name: "Autre Pays (Afrique)", flag: "🌍", region: "africa", currency: "FCFA", symbol: "FCFA" },
];

export function detectUserCountry(): CountryOption {
  // Check local storage first
  try {
    const savedCode = localStorage.getItem("user_selected_country_code");
    if (savedCode) {
      const found = COUNTRIES.find(c => c.code === savedCode);
      if (found) return found;
    }
  } catch (e) {}

  // Detect by browser timezone
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (tz.startsWith("Africa/")) {
      if (tz.includes("Douala")) return COUNTRIES.find(c => c.code === "CM")!;
      if (tz.includes("Dakar")) return COUNTRIES.find(c => c.code === "SN")!;
      if (tz.includes("Abidjan")) return COUNTRIES.find(c => c.code === "CI")!;
      if (tz.includes("Libreville")) return COUNTRIES.find(c => c.code === "GA")!;
      if (tz.includes("Casablanca")) return COUNTRIES.find(c => c.code === "MA")!;
      if (tz.includes("Lagos")) return COUNTRIES.find(c => c.code === "NG")!;
      return COUNTRIES.find(c => c.code === "AFR") || COUNTRIES.find(c => c.code === "CM")!;
    }
    if (tz.startsWith("America/")) {
      return COUNTRIES.find(c => c.code === "US")!;
    }
    if (tz.startsWith("Europe/")) {
      return COUNTRIES.find(c => c.code === "FR")!;
    }
  } catch (e) {}

  // Default to France
  return COUNTRIES[0];
}

export function getProductPriceForRegion(product: DigitalProduct, region: RegionCode): number {
  if (product.regionalPrices) {
    if (region === "eu" && product.regionalPrices.eu !== undefined && product.regionalPrices.eu > 0) {
      return product.regionalPrices.eu;
    }
    if (region === "us" && product.regionalPrices.us !== undefined && product.regionalPrices.us > 0) {
      return product.regionalPrices.us;
    }
    if (region === "africa" && product.regionalPrices.africa !== undefined && product.regionalPrices.africa > 0) {
      return product.regionalPrices.africa;
    }
  }

  // Fallback calculations based on base EUR price
  const basePrice = product.price || 0;
  if (region === "eu") return basePrice;
  if (region === "us") return Math.round((basePrice * 1.1) * 100) / 100;
  if (region === "africa") return Math.round(basePrice * 650);

  return basePrice;
}

export function getOriginalPriceForRegion(productOrPrice: DigitalProduct | number | undefined, region: RegionCode): number | undefined {
  const orig = typeof productOrPrice === "object" ? productOrPrice.originalPrice : productOrPrice;
  if (!orig || orig <= 0) return undefined;
  if (region === "eu") return orig;
  if (region === "us") return Math.round((orig * 1.1) * 100) / 100;
  if (region === "africa") return Math.round(orig * 650);
  return orig;
}

export function formatPriceValue(amount: number, symbolOrRegion?: string, currencyCode?: string): string {
  if (symbolOrRegion === "eu" || currencyCode === "EUR") {
    return `${amount.toFixed(2)} €`;
  }
  if (symbolOrRegion === "us" || currencyCode === "USD") {
    return `$${amount.toFixed(2)}`;
  }
  if (symbolOrRegion === "africa" || currencyCode === "FCFA" || symbolOrRegion === "FCFA") {
    return `${Math.round(amount).toLocaleString("fr-FR")} FCFA`;
  }
  if (symbolOrRegion) {
    if (symbolOrRegion === "$") return `$${amount.toFixed(2)}`;
    if (symbolOrRegion === "€") return `${amount.toFixed(2)} €`;
    return `${Math.round(amount).toLocaleString("fr-FR")} ${symbolOrRegion}`;
  }
  return `${amount.toFixed(2)} €`;
}
