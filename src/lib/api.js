// src/lib/api.js
import axios from "axios";

// En prod, on veut utiliser le proxy Vercel (/api → backend) => baseURL relative "".
// On ne met VITE_API_BASE que si on DOIT forcer un domaine (ex: dev local).
const IS_BROWSER = typeof window !== "undefined";

// Si VITE_API_BASE est défini, on l'utilise (utile en local).
// Sinon, on reste en relative ("") pour profiter du proxy/rewrite Vercel.
const ROOT = (import.meta.env.VITE_API_BASE ?? "").toString().replace(/\/+$/, "");

export const api = axios.create({
  baseURL: ROOT, // "" en prod -> même origine
  headers: { Accept: "application/json", "Content-Type": "application/json" },
});

console.log("[api] ROOT =", ROOT || "(relative)");

// Ajoute le Bearer si présent + force le préfixe /api
api.interceptors.request.use((config) => {
  const token = IS_BROWSER ? localStorage.getItem("token") : null;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  const url = config.url || "";
  if (!/^\/api\//.test(url)) {
    config.url = "/api" + (url.startsWith("/") ? url : `/${url}`);
  }

  // (facultatif) Indiquer que c'est une requête AJAX pour certains WAF
  config.headers["X-Requested-With"] = "XMLHttpRequest";

  console.debug("[api →]", config.method?.toUpperCase(), (config.baseURL || "") + config.url);
  return config;
});

// Normalisation des réponses pour feed & discover
api.interceptors.response.use(
  (res) => {
    try {
      const fullUrl = (res.config?.baseURL || "") + (res.config?.url || "");
      const isFeed = /\/api\/feed(?:\b|\/|\?)/.test(fullUrl);
      const isDiscover = /\/api\/discover(?:\b|\/|\?)/.test(fullUrl);

      if (isFeed || isDiscover) {
        let data = res.data;

        // --- Normaliser la liste d'items quel que soit le format d'entrée ---
        let items;
        if (Array.isArray(data)) {
          // back renvoie déjà un tableau
          items = data;
        } else if (data && Array.isArray(data.items)) {
          // back renvoie { items, page, total }
          items = data.items;
        } else {
          items = []; // forme inattendue
        }

        // --- Alias d'image pour l'ancien front (cover / image_url) ---
        items = items.map((row) => {
          const r = row && typeof row === "object" ? { ...row } : row;
          if (r && typeof r === "object") {
            const thumbUrl = r?.thumb?.url ?? r?.thumb_url ?? r?.image_url ?? null;
            if (r.cover == null) r.cover = thumbUrl;
            if (r.image_url == null) r.image_url = r.cover ?? null;
          }
          return r;
        });

        // --- ***DIFFÉRENTIEL ENTRE FEED ET DISCOVER*** ---
        if (isFeed) {
          // Le composant Feed attend { items, page, total }
          // Si le back a renvoyé un tableau, on le re-emballe proprement :
          if (!data || !Array.isArray(data.items)) {
            res.data = { items, page: 1, total: items.length };
          } else {
            // Le back avait déjà { items, ... } → on remplace juste items normalisés
            res.data = { ...data, items };
          }
        } else {
          // Discover attend un tableau simple
          res.data = items;
        }
      }
    } catch {
      // pas de panique si la normalisation échoue
    }

    return res;
  },
  (err) => {
    const status = err?.response?.status ?? "no-response";
    const fullUrl = (err?.config?.baseURL || "") + (err?.config?.url || "");
    console.error("[api ✕]", status, fullUrl, err?.message);
    return Promise.reject(err);
  }
);

export default api;
