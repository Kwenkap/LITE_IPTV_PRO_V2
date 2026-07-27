// Utility to detect Smart TVs, TV Browsers, and low-performance devices

export function isTVDevice(): boolean {
  if (typeof window === "undefined" || !navigator) return false;
  const ua = (navigator.userAgent || "").toLowerCase();
  
  // Common TV user agents (Tizen, WebOS, Android TV, Fire TV, Apple TV, Roku, Bravia, Viera, Chromecast, HBBTV, SmartTV, etc.)
  const tvKeywords = [
    "smart-tv", "smarttv", "googletv", "appletv", "hbbtv", "pov_tv", 
    "netcast", "webos", "tizen", "roku", "firetv", "viera", "bravia", 
    "aftb", "aftm", "afts", "aftt", "crkey", "tv", "mibox", "shield"
  ];

  return tvKeywords.some(keyword => ua.includes(keyword));
}

export function isLowPowerDevice(): boolean {
  if (typeof window === "undefined" || !navigator) return false;
  if (isTVDevice()) return true;

  // Check hardware concurrency (low CPU core count)
  const cores = navigator.hardwareConcurrency || 4;
  if (cores <= 2) return true;

  // Check if prefers-reduced-motion is active
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return true;
  }

  return false;
}
