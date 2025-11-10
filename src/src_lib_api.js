import axios from "axios";

/**
 * Client HTTP centralisé pour l'API DOHI.
 *
 * Objectifs :
 * 1) Toujours viser /api/... (même si baseURL n’a pas /api)
 * 2) Normaliser feed/discover quand nécessaire
 * 3) Aider l’ancien front (cover/image_url)
 * 4) Gérer proprement les cookies (WAF o2switch) ⇒ withCredentials:true
 */

// Base SANS /api (on l’ajoute nous-mêmes)
const ROOT = (import.meta.env.VITE_API_BASE || "http://localhost:8000").replace(/\/+$/, "");

export const api = axios.create({
  baseURL: ROOT,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  // IMPORTANT : permet au navigateur de recevoir/envoyer les cookies
  // (ex. o2s-chl posé par le WAF) pour la requête suivante.
  withCredentials: true,
  timeout: 20000,
});

// Log discret pour diagnostiquer la base (visible dev uniquement)
if (import.meta.env.DEV) {
  console.log("[api] ROOT =", ROOT);
}

// ———————————————— Request interceptor ———————————————— //
api.interceptors.request.use((config) => {
  // Token Bearer si présent (auth par jeton côté API)
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Forcer le préfixe /api/ une seule fois
  const url = config.url || "";
  if (!/^\/api\//.test(url)) {
    config.url = "/api" + (url.startsWith("/") ? url : `/${url}`);
  }

  // Debug lisible
  if (import.meta.env.DEV) {
    console.debug("[api →]", (config.method || "GET").toUpperCase(), config.baseURL + config.url);
  }
  return config;
});

// ———————————————— Helpers normalisation ———————————————— //
function normalizeItemsPayload(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;
  return [];
}

function inflateFeedLike(data, items) {
  if (!data || !Array.isArray(data.items)) {
    return { items, page: 1, total: items.length };
  }
  return { ...data, items };
}

// ———————————————— Response interceptor ———————————————— //
api.interceptors.response.use(
  (res) => {
    try {
      const fullUrl = (res.config?.baseURL || "") + (res.config?.url || "");
      const isFeed = /\/api\/feed(?:\b|\/|\?)/.test(fullUrl);
      const isDiscover = /\/api\/discover(?:\b|\/|\?)/.test(fullUrl);

      if (isFeed || isDiscover) {
        const items = normalizeItemsPayload(res.data).map((row) => {
          const r = row && typeof row === "object" ? { ...row } : row;
          if (r && typeof r === "object") {
            const thumbUrl = r?.thumb?.url ?? r?.thumb_url ?? r?.image_url ?? null;
            if (r.cover == null) r.cover = thumbUrl;
            if (r.image_url == null) r.image_url = r.cover ?? null;
          }
          return r;
        });

        res.data = isFeed ? inflateFeedLike(res.data, items) : items;
      }
    } catch {
      // silencieux : on ne casse pas la réponse
    }
    return res;
  },
  async (err) => {
    // Cas typiques : 307 du WAF (cookie de challenge), 405, 4xx/5xx…
    const cfg = err?.config || {};
    const status = err?.response?.status ?? "no-response";
    const fullUrl = (cfg.baseURL || "") + (cfg.url || "");

    if (import.meta.env.DEV) {
      console.error("[api ✕]", status, fullUrl, err?.message);
    }

    // Si le WAF renvoie 307 (rarement visible côté XHR), on peut retenter UNE fois.
    // NB: Dans le navigateur, les redirections sont gérées nativement.
    // Ce retry couvre certains cas où le cookie vient d’être posé entre deux requêtes.
    if (status === 307 && !cfg.__retried307) {
      try {
        const retryCfg = { ...cfg, __retried307: true };
        return await api.request(retryCfg);
      } catch (e) {
        // tombe dans le reject plus bas
      }
    }

    return Promise.reject(err);
  }
);

export default api;
