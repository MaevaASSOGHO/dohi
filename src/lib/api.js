// src/lib/api.js
import axios from "axios";

// Base vide → URLs relatives (ex: /api/login) en DEV & PROD
const ROOT = "";

// Instance axios
export const api = axios.create({
  baseURL: ROOT,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Préfixer /api si manquant
  const url = config.url || "";
  if (!/^\/api\//.test(url)) {
    config.url = "/api" + (url.startsWith("/") ? url : `/${url}`);
  }
  // LOG de contrôle (garde-le provisoirement)
  console.debug("[api →]", config.method?.toUpperCase(), (config.baseURL || "") + config.url);
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status ?? "no-response";
    const fullUrl = (err?.config?.baseURL || "") + (err?.config?.url || "");
    console.error("[api ✕]", status, fullUrl, err?.message);
    return Promise.reject(err);
  }
);

export default api;
