export type ProductCategory = "streaming" | "software" | "social";

export type StockStatus = "in_stock" | "limited" | "out_of_stock";

export interface RegionalPrices {
  eu?: number; // Price in EUR (€)
  us?: number; // Price in USD ($)
  africa?: number; // Price in FCFA (XAF/XOF)
}

export interface DigitalProduct {
  id: string;
  title: string;
  category: ProductCategory;
  price: number; // Base price (EUR by default)
  regionalPrices?: RegionalPrices;
  originalPrice?: number;
  description: string;
  stockStatus: StockStatus;
  badge?: string;
  durationOrType: string; // e.g. "Compte 1 Mois", "Clé à vie", "1000 Abonnés"
  iconName: string; // Icon identifier
  popular?: boolean;
  features?: string[];
  createdAt?: number;
}

export interface CartItem {
  product: DigitalProduct;
  quantity: number;
}

export type OrderStatus = "pending" | "delivered" | "cancelled";

export interface DigitalOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string; // WhatsApp number
  paymentMethod: "crypto" | "card" | "paypal" | "western_union" | "mobile_money";
  items: CartItem[];
  totalAmount: number;
  currency?: string;
  currencySymbol?: string;
  regionCode?: "eu" | "us" | "africa";
  status: OrderStatus;
  createdAt: number;
  notes?: string;
}
