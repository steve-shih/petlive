"use client";

if (typeof window !== "undefined" && !(window as any).__fetchPatched) {
  (window as any).__fetchPatched = true;
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    let [resource, config] = args;
    if (!config) config = {};
    if (!config.headers) config.headers = {};
    
    // Append ngrok bypass header
    config.headers = {
      ...config.headers,
      "ngrok-skip-browser-warning": "69420"
    };
    
    return originalFetch(resource, config);
  };
}

export default function NgrokBypass() {
  return null;
}
