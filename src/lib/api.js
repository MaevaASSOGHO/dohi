// src/lib/api.js
import axios from "axios";

const BASE =
  import.meta.env.VITE_API_URL?.replace(/\/+$/, "") ||
  "http://localhost:8000/api";

export const api = axios.create({
  baseURL: BASE,
  headers: { Accept: "application/json" },
});

// Ajoute automatiquement le Bearer si présent
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 => purge token + redirection /login
let alreadyRedirecting = false;
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401 && !alreadyRedirecting) {
      alreadyRedirecting = true;
      try { localStorage.removeItem("token"); } catch {}
      const path = window.location.pathname || "";
      if (!/\/(login|register)$/i.test(path)) {
        window.location.assign("/login");
      } else {
        alreadyRedirecting = false;
      }
    }
    return Promise.reject(err);
  }
);

export default api;
