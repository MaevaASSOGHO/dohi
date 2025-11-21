import axios from "axios";

const ROOT = (import.meta.env.VITE_API_BASE || "http://localhost:8000").replace(
  /\/+$/,
  ""
);

// Client HTTP principal
export const api = axios.create({
  baseURL: ROOT,
  withCredentials: true, // important pour le cookie TigerProtect
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

console.log("[api] ROOT =", ROOT);

// Prefixe toujours /api et ajoute le Bearer
api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
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

// Normalisation feed/discover + gestion TigerProtect (307)
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
            const thumbUrl =
              r?.thumb?.url ?? r?.thumb_url ?? r?.image_url ?? null;
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
    const sameUrl = !!(
      loc &&
      cfg &&
      loc === (cfg.baseURL || "") + (cfg.url || "")
    );

    // 307 TigerProtect : on ping /api/ping pour choper le cookie, puis on rejoue UNE fois
    if (status === 307 && sameUrl && !cfg?._wafRetried) {
      try {
        await api.get("/ping", {
          params: { t: Date.now() },
          withCredentials: true,
        });
      } catch {}
      cfg._wafRetried = true;
      return api(cfg);
    }

    console.error(
      "[api ✕]",
      status,
      (cfg?.baseURL || "") + (cfg?.url || ""),
      err?.message
    );
    return Promise.reject(err);
  }
);

/* ------------------------------------------------------------------
 * HELPERS : désormais TOUS parlent directement au backend Laravel.
 * ------------------------------------------------------------------ */

// LOGIN
export function loginViaApi(payload) {
  // → /api/login
  return api.post("/login", payload);
}

// REGISTER
export function registerViaApi(payload) {
  // → /api/register
  return api.post("/register", payload);
}

// CASES
export function createCaseViaApi(payload) {
  // → /api/cases
  return api.post("/cases", payload);
}

// REPORTS
export function createReportViaApi(payload) {
  // → /api/reports
  return api.post("/reports", payload);
}

// EVIDENCE (upload fichier)
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

  // → /api/reports/{id}/evidence
  return api.post(`/reports/${reportId}/evidence`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

// VOTE REPORT
export function voteReportViaApi(reportId, useful) {
  if (!reportId) throw new Error("reportId manquant pour vote");
  // → /api/reports/{id}/vote
  return api.post(`/reports/${reportId}/vote`, { useful });
}

export function unvoteReportViaApi(reportId) {
  if (!reportId) throw new Error("reportId manquant pour unvote");
  // → /api/reports/{id}/vote
  return api.delete(`/reports/${reportId}/vote`);
}

// COMMENTAIRES
export function commentReportViaApi(reportId, { kind, message }) {
  if (!reportId) throw new Error("reportId manquant pour le commentaire");
  // → /api/reports/{id}/comments
  return api.post(`/reports/${reportId}/comments`, { kind, message });
}

// NOTIFICATIONS
export function markAllNotificationsReadViaApi() {
  // → /api/notifications/read-all
  return api.post("/notifications/read-all");
}

export function markNotificationReadStatusViaApi(id, currentlyRead) {
  if (!id) throw new Error("id de notification manquant");

  const endpoint = currentlyRead
    ? "/notifications/unread"
    : "/notifications/read";

  // → /api/notifications/(un)read
  return api.post(endpoint, { ids: [id] });
}

// KYC
export function kycSubmitViaApi(formData) {
  // → /api/kyc
  return api.post("/kyc", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export function kycCancelViaApi() {
  // → /api/kyc (DELETE)
  return api.delete("/kyc");
}

export function kycSignedUrlViaApi(path, ttl) {
  // → /api/kyc/signed-url
  return api.post("/kyc/signed-url", { path, ttl });
}

// LOGOUT
export function logoutViaApi() {
  // adapte si ta route est différente (ex: /logout)
  return api.post("/auth/logout");
}

export default api;
