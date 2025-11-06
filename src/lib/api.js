// src/lib/api.js
import axios from "axios";

/**
 * On veut 3 garanties :
 * 1) Toujours appeler le backend avec un chemin commençant par /api/ (même si baseURL n'a pas /api)
 * 2) Normaliser feed/discover : si le back renvoie { items: [...] }, on transforme en [...]
 *    (et si le back renvoie déjà [...], on ne touche à rien)
 * 3) Aider le front historique : alias 'cover' si seule 'thumb.url' existe
 */

// Base racine SANS /api (on l’ajoute nous-mêmes sur chaque requête)
const ROOT = (import.meta.env.VITE_API_BASE || "http://localhost:8000").replace(/\/+$/, "");

export const api = axios.create({
  baseURL: ROOT, // racine du domaine
  headers: { Accept: "application/json", "Content-Type": "application/json" },
});

// Log discret pour vérifier la base côté front
console.log("[api] ROOT =", ROOT);

// Ajoute le Bearer si présent
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Normaliser l'URL : forcer le préfixe /api/
  // - Si l’appel a déjà /api/ en tête, on laisse tel quel.
  // - Sinon, on préfixe.
  const url = config.url || "";
  if (!/^\/api\//.test(url)) {
    config.url = "/api" + (url.startsWith("/") ? url : `/${url}`);
  }

  // Petit log utile (voir exactement quelle URL part)
  // (visible dans la console desktop / sur mobile via devtools distant)
  console.debug("[api →]", config.method?.toUpperCase(), config.baseURL + config.url);

  return config;
});

// Normalisation des réponses pour feed & discover
api.interceptors.response.use(
  (res) => {
    try {
      const fullUrl = (res.config?.baseURL || "") + (res.config?.url || "");
      // On ne normalise QUE ces endpoints:
      const isFeed = /\/api\/feed(?:\b|\/|\?)/.test(fullUrl);
      const isDiscover = /\/api\/discover(?:\b|\/|\?)/.test(fullUrl);

      if (isFeed || isDiscover) {
        let data = res.data;

        // 1) Si le back renvoie { items: [...] }, on remplace par [...]
        if (data && !Array.isArray(data) && Array.isArray(data.items)) {
          data = data.items;
        }

        // 2) Alias 'cover' pour compat front historique
        if (Array.isArray(data)) {
          data = data.map((row) => {
            const r = row && typeof row === "object" ? { ...row } : row;
            if (r && typeof r === "object") {
              const thumbUrl =
                r?.thumb?.url ??
                r?.thumb_url ??
                r?.image_url ??
                null;

              if (r.cover == null) r.cover = thumbUrl;
              if (r.image_url == null) r.image_url = r.cover ?? null;
            }
            return r;
          });
        }

        res.data = data;
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
