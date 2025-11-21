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

// Evidence helper
export function uploadEvidenceViaApi(reportId, fileObj) {
  if (!reportId) throw new Error("reportId manquant pour l'upload d'évidence");

  const form = new FormData();
  form.append("file", fileObj.file);
  const mime = (fileObj.mime || fileObj.file?.type || "").toLowerCase();
  const evType = mime.startsWith("image/")
    ? "image"
    : mime.startsWith("video/")
    ? "video"
    : "doc";
  form.append("type", evType);

  if (import.meta.env.DEV) {
    // Dev : direct backend Laravel
    return api.post(`/api/reports/${reportId}/evidence`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  // Prod : proxy Vercel
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  return axios.post(
    `/api/reports-evidence-proxy?reportId=${encodeURIComponent(reportId)}`,
    form,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      // NE PAS fixer Content-Type ici : Axios le mettra avec la bonne boundary
    }
  );
}

// --- Vote d'un report (utile / pas utile) ---

export function voteReportViaApi(reportId, useful) {
  if (!reportId) throw new Error("reportId manquant pour vote");

  if (import.meta.env.DEV) {
    // Dev : direct Laravel
    return api.post(`/api/reports/${reportId}/vote`, { useful });
  }

  // Prod : proxy Vercel
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  return axios.post(
    "/api/report-vote-proxy",
    { reportId, useful },
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );
}

export function unvoteReportViaApi(reportId) {
  if (!reportId) throw new Error("reportId manquant pour unvote");

  if (import.meta.env.DEV) {
    // Dev : direct Laravel
    return api.delete(`/api/reports/${reportId}/vote`);
  }

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  return axios.post(
    "/api/report-unvote-proxy",
    { reportId },
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );
}

export function commentReportViaApi(reportId, { kind, message }) {
  if (!reportId) throw new Error("reportId manquant pour le commentaire");

  if (import.meta.env.DEV) {
    // Dev : direct backend Laravel
    return api.post(`/api/reports/${reportId}/comments`, { kind, message });
  }

  // Prod : proxy Vercel
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  return axios.post(
    "/api/report-comment-proxy",
    { reportId, kind, message },
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );
}

// Notifications helper

export function markAllNotificationsReadViaApi() {
  if (import.meta.env.DEV) {
    // Dev : direct backend (api = axios avec baseURL=VITE_API_BASE)
    return api.post("/notifications/read-all");
  }

  // Prod : proxy Vercel
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  return axios.post(
    "/api/notifications-read-all-proxy",
    {},
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );
}

export function markNotificationReadStatusViaApi(id, currentlyRead) {
  if (!id) throw new Error("id de notification manquant");

  const endpointDev = currentlyRead
    ? "/notifications/unread"
    : "/notifications/read";

  if (import.meta.env.DEV) {
    return api.post(endpointDev, { ids: [id] });
  }

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const endpointProd = currentlyRead
    ? "/api/notifications-unread-proxy"
    : "/api/notifications-read-proxy";

  return axios.post(
    endpointProd,
    { ids: [id] },
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );
}

// KYC helper

export function kycSubmitViaApi(formData) {
  if (import.meta.env.DEV) {
    // Dev : direct Laravel
    return api.post("/kyc", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  // Prod : via proxy Vercel
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  return axios.post("/api/kyc-submit-proxy", formData, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    // NE PAS fixer Content-Type ici : axios le mettra avec la boundary
  });
}

export function kycCancelViaApi() {
  if (import.meta.env.DEV) {
    return api.delete("/kyc");
  }

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  return axios.post(
    "/api/kyc-cancel-proxy",
    {},
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );
}

export function kycSignedUrlViaApi(path, ttl) {
  if (import.meta.env.DEV) {
    return api.post("/kyc/signed-url", { path, ttl });
  }

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  return axios.post(
    "/api/kyc-signed-url-proxy",
    { path, ttl },
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );
}
// Logout helper

export function logoutViaApi() {
  if (import.meta.env.DEV) {
    return api.post("/api/logout");
  }
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  return axios.post(
    "/api/logout-proxy",
    {},
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );
}
export default api;
