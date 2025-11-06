// src/lib/api.js
import axios from "axios";

const BASE =
  (import.meta.env.VITE_API_BASE?.replace(/\/+$/, "")) ||
  "http://localhost:8000";   

export const api = axios.create({
  baseURL: BASE,
  headers: { Accept: "application/json" },
});

console.log("API base =", BASE);

// Bearer auto
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) {
    cfg.headers = cfg.headers || {};
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  // ↙︎ n’ajoute Content-Type que si nécessaire
  const m = (cfg.method || "get").toLowerCase();
  const needsBody = ["post", "put", "patch"].includes(m);
  if (needsBody && !(cfg.data instanceof FormData)) {
    cfg.headers = cfg.headers || {};
    if (!cfg.headers["Content-Type"]) {
      cfg.headers["Content-Type"] = "application/json";
    }
  }
  return cfg;
});
