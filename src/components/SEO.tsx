import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  keywords?: string;
  type?: "website" | "product" | "article";
  jsonLd?: Record<string, any>;
}

export default function SEO({
  title = "POWER IPTV - Abonnements IPTV Premium 4K, Web Player & Streaming TV",
  description = "Découvrez Power IPTV : Le leader de l'abonnement IPTV Premium 4K & FHD. Accédez à plus de 20 000 chaînes TV en direct, films et séries VOD sans coupure.",
  canonicalUrl = typeof window !== "undefined" ? window.location.href : "https://poweriptvv2.netlify.app/",
  keywords = "Power IPTV, Power IPTV v2, poweriptvv2, Power IPTV abonnement, Power IPTV player, IPTV Premium France, abonnement IPTV 4K, IPTV smart tv, web player IPTV",
  type = "website",
  jsonLd,
}: SEOProps) {
  useEffect(() => {
    // 1. Update Document Title
    document.title = title;

    // Helper to update or create meta tags
    const setMetaTag = (selector: string, attr: string, value: string, content: string) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attr, value);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    // 2. Update Standard Meta Tags
    setMetaTag('meta[name="description"]', 'name', 'description', description);
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', keywords);

    // 3. Update OpenGraph Tags
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', title);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', type);

    // 4. Update Twitter Tags
    setMetaTag('meta[property="twitter:title"]', 'property', 'twitter:title', title);
    setMetaTag('meta[property="twitter:description"]', 'property', 'twitter:description', description);

    // 5. Update Canonical Link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", canonicalUrl);

    // 6. Dynamic JSON-LD Structured Data
    if (jsonLd) {
      const scriptId = "dynamic-jsonld-seo";
      let scriptElement = document.getElementById(scriptId) as HTMLScriptElement | null;
      if (!scriptElement) {
        scriptElement = document.createElement("script");
        scriptElement.id = scriptId;
        scriptElement.type = "application/ld+json";
        document.head.appendChild(scriptElement);
      }
      scriptElement.textContent = JSON.stringify(jsonLd);
    }

  }, [title, description, canonicalUrl, keywords, type, jsonLd]);

  return null;
}
