// api/login-proxy.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // 1) On récupère l'action : login (par défaut) ou forgot
    const action = (req.query?.action || "login").toString();

    // 2) On choisit l'URL cible Laravel
    let targetUrl;
    if (action === "forgot") {
      // Mot de passe oublié
      targetUrl = "https://dohi.chat-mabelle.com/api/password/forgot";
    } else {
      // Login normal (cas par défaut)
      targetUrl = "https://dohi.chat-mabelle.com/api/login";
    }

    // 3) On récupère le payload JSON
    let payload = {};
    if (typeof req.body === "string") {
      payload = req.body ? JSON.parse(req.body) : {};
    } else if (req.body) {
      payload = req.body;
    }

    // 4) On forward vers Laravel
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
