// api/login-proxy.js

const API_BASE = process.env.API_BASE || "https://dohi.chat-mabelle.com";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Récupère l'action depuis la query ?action=login|forgot
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    const action = urlObj.searchParams.get("action") || "login";

    let targetPath = "/api/login";
    if (action === "forgot") {
      targetPath = "/api/password/forgot";
    }

    const rawBody = req.body || {};
    const payload =
      typeof rawBody === "string" ? JSON.parse(rawBody || "{}") : rawBody;

    const upstream = await fetch(`${API_BASE}${targetPath}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await upstream.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    return res.status(upstream.status).json(data);
  } catch (error) {
    console.error("Proxy login/forgot error:", error);
    return res.status(500).json({
      message: "Proxy error (login/forgot)",
      error: error?.message || String(error),
    });
  }
}
