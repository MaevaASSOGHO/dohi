import axios from "axios";

const isDev = import.meta.env.DEV;

// En dev : on parle au backend Laravel (http://localhost:8000)
// En prod : on parle au proxy Vercel (same-origin)
const ROOT = isDev
  ? (import.meta.env.VITE_API_BASE || "http://localhost:8000").replace(/\/+$/, "")
  : "/api/proxy";

export const api = axios.create({
  baseURL: ROOT,
  withCredentials: isDev, // cookies seulement en dev si tu en as besoin
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

console.log("[api] ROOT =", ROOT);

api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  config.headers = config.headers || {};
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  let url = config.url || "";

  if (isDev) {
    // Dev : on parle direct à Laravel, on prefixe /api si besoin
    if (!/^\/api\//.test(url)) {
      url = "/api" + (url.startsWith("/") ? url : `/${url}`);
    }
    config.url = url;
  } else {
    // Prod : on parle à /api/proxy/[...path]
    // On enlève les / initiaux et un éventuel 'api/' au début
    url = url.replace(/^\/+/, ""); // "/cases" -> "cases" ; "/api/cases" -> "api/cases"
    url = url.replace(/^api\//, ""); // "api/cases" -> "cases"
    config.url = url; // → /api/proxy/cases
  }

  return config;
});

// Normalisation feed/discover comme avant
api.interceptors.response.use(
  (res) => {
    try {
      const fullUrl = (res.config?.baseURL || "") + (res.config?.url || "");
      const isFeed = /\/api\/feed(?:\b|\/|\?)/.test(fullUrl);
      const isDiscover = /\/api\/discover(?:\b|\/|\?)/.test(fullUrl);

      if (isFeed || isDiscover) {
        let data = res.data;
        let items;
        if (Array.isArray(data)) items = data;
        else if (data && Array.isArray(data.items)) items = data.items;
        else items = [];

        items = items.map((row) => {
          const r = row && typeof row === "object" ? { ...row } : row;
          if (r && typeof r === "object") {
            const thumbUrl = r?.thumb?.url ?? r?.thumb_url ?? r?.image_url ?? null;
            if (r.cover == null) r.cover = thumbUrl;
            if (r.image_url == null) r.image_url = r.cover ?? null;
          }
          return r;
        });

        if (isFeed) {
          if (!data || !Array.isArray(data.items)) {
            res.data = { items, page: 1, total: items.length };
          } else {
            res.data = { ...data, items };
          }
        } else {
          res.data = items;
        }
      }
    } catch {}
    return res;
  },
  (err) => {
    const cfg = err?.config;
    const status = err?.response?.status ?? "no-response";
    console.error(
      "[api ✕]",
      status,
      (cfg?.baseURL || "") + (cfg?.url || ""),
      err?.message
    );
    return Promise.reject(err);
  }
);

export default api;
