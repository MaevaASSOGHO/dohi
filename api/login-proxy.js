// api/login-proxy.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // On choisit l'action : login (par défaut) ou forgot
    const action = (req.query && req.query.action) || "login";

    // Base URL de ton backend Laravel
    const API_BASE =
      process.env.VITE_API_BASE ||
      process.env.NEXT_PUBLIC_API_BASE ||
      "https://dohi.chat-mabelle.com";

    let targetUrl;
    if (action === "forgot") {
      // Mot de passe oublié
      targetUrl = `${API_BASE.replace(/\/+$/, "")}/api/password/forgot`;
    } else {
      // Login classique
      targetUrl = `${API_BASE.replace(/\/+$/, "")}/api/login`;
    }

    // Corps JSON envoyé par le front
    const payload =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};

    const apiResponse = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await apiResponse.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    res.status(apiResponse.status).json(data);
  } catch (error) {
    console.error("Proxy login/forgot error:", error);
    res.status(500).json({
      message: "Proxy error (login/forgot)",
      error: error.message || String(error),
    });
  }
}
