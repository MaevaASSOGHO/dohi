// api/login-proxy.js

export default async function handler(req, res) {
  // On n'accepte que POST
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Récupérer l'action dans la query (?action=forgot)
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const action = url.searchParams.get("action") || "login";

    // Récupérer le body en JSON, quelle que soit la forme
    let rawBody = {};
    if (typeof req.body === "string") {
      try {
        rawBody = JSON.parse(req.body || "{}");
      } catch {
        rawBody = {};
      }
    } else if (req.body && typeof req.body === "object") {
      rawBody = req.body;
    } else {
      // fallback : on lit le flux brut si jamais req.body est vide
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const str = Buffer.concat(chunks).toString("utf8");
      try {
        rawBody = str ? JSON.parse(str) : {};
      } catch {
        rawBody = {};
      }
    }

    let targetUrl;
    let payload;

    if (action === "forgot") {
      // Mot de passe oublié → on appelle /api/password/forgot du backend
      targetUrl = "https://dohi.chat-mabelle.com/api/password/forgot";
      payload = { email: rawBody.email || "" };
    } else {
      // Login classique → /api/login
      targetUrl = "https://dohi.chat-mabelle.com/api/login";
      payload = {
        email: rawBody.email || "",
        password: rawBody.password || "",
      };
    }

    // Appel au backend Laravel
    const upstream = await fetch(targetUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
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

    res.status(upstream.status).json(data);
  } catch (error) {
    console.error("login-proxy error:", error);
    res.status(500).json({
      message: "Proxy error (login/forgot)",
      error: error?.message || String(error),
    });
  }
}
