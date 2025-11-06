// src/lib/api.js (garde ça simple et stable)
import axios from "axios";
const BASE = (import.meta.env.VITE_API_BASE?.replace(/\/+$/, "")) || "http://localhost:8000";
const api = axios.create({ baseURL: BASE, headers: { Accept: "application/json" } });
// (interceptors Authorization comme tu avais)
export default api;
