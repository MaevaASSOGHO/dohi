import axios from "axios";
import api from "./api"; // si api.js est dans le même dossier

export function loginViaApi(payload) {
  if (import.meta.env.DEV) {
    // dev : direct backend
    return api.post("/api/login", payload);
  }
  // prod : proxy Vercel
  return axios.post("/api/login-proxy", payload);
}

export function registerViaApi(payload) {
  if (import.meta.env.DEV) {
    return api.post("/api/register", payload);
  }
  return axios.post("/api/register-proxy", payload);
}

export function createCaseViaApi(payload) {
  if (import.meta.env.DEV) {
    return api.post("/api/cases", payload);
  }
  const token = localStorage.getItem("token");
  return axios.post("/api/cases-proxy", payload, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export function createReportViaApi(payload) {
  if (import.meta.env.DEV) {
    return api.post("/api/reports", payload);
  }
  const token = localStorage.getItem("token");
  return axios.post("/api/reports-proxy", payload, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export function logoutViaApi() {
  if (import.meta.env.DEV) {
    return api.post("/api/logout");
  }
  const token = localStorage.getItem("token");
  return axios.post("/api/logout-proxy", null, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
