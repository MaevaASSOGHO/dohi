import axios from "axios";

const ROOT = (import.meta.env.VITE_API_BASE || "http://localhost:8000").replace(/\/+$/, "");

export const api = axios.create({
  baseURL: ROOT,
  withCredentials: true, // ← important avec le WAF/cookies
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest", // aide certaines protections à reconnaître un XHR
  },
});

console.log("[api] ROOT =", ROOT);

// Prefixe toujours /api
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  const url = config.url || "";
  if (!/^\/api\//.test(url)) {
    config.url = "/api" + (url.startsWith("/") ? url : `/${url}`);
  }
  return config;
});

// Normalisation feed/discover
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
  async (err) => {
    const cfg = err?.config;
    const status = err?.response?.status ?? "no-response";
    const loc = err?.response?.headers?.location;
    const sameUrl = !!(loc && cfg && (loc === (cfg.baseURL || "") + (cfg.url || "")));

    // ↻ Gestion WAF: 307 temporaire → on ping pour prendre le cookie, puis on rejoue UNE FOIS
    if (status === 307 && sameUrl && !cfg?._wafRetried) {
      try {
        await api.get("/ping", { params: { t: Date.now() }, withCredentials: true });
      } catch {}
      cfg._wafRetried = true;
      return api(cfg);
    }

    console.error("[api ✕]", status, (cfg?.baseURL || "") + (cfg?.url || ""), err?.message);
    return Promise.reject(err);
  }
);

/**
 * Login helper :
 * - en dev → parle directement à Laravel (http://localhost:8000/api/login)
 * - en prod (Vercel) → passe par /api/login-proxy (same-origin, pas de CORS/Tiger)
 */
export async function loginViaApi(payload) {
  if (import.meta.env.DEV) {
    // Dev local : on garde le client API normal
    return api.post("/login", payload);
  }

  // Prod (Vercel) : on parle au proxy en same-origin
  return axios.post("/api/login-proxy", payload, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    // pas besoin de withCredentials ici, c'est same-origin avec Vercel
  });
}

// Inscription helper
export function registerViaApi(payload) {
  if (import.meta.env.DEV) {
    return api.post("/api/register", payload);
  }
  return axios.post("/api/register-proxy", payload);
}

// Création de case
export function createCaseViaApi(payload) {
  if (import.meta.env.DEV) {
    // Dev : direct backend
    return api.post("/api/cases", payload);
  }

  // Prod : proxy, même schéma que login
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  return axios.post("/api/cases-proxy", payload, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

// Création de report
export function createReportViaApi(payload) {
  if (import.meta.env.DEV) {
    // Dev : direct backend
    return api.post("/api/reports", payload);
  }

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  return axios.post("/api/reports-proxy", payload, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export default api;
