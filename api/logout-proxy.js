// api/logout-proxy.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    // On propage le Bearer token si présent
    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }

    const upstream = await fetch("https://dohi.chat-mabelle.com/api/logout", {
      method: "POST",
      headers,
    });

    const status = upstream.status;
    const text = await upstream.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    return res.status(status).json(data);
  } catch (error) {
    console.error("logout-proxy error:", error);
    return res.status(500).json({
      message: "Proxy error (logout)",
      error: error?.message || String(error),
    });
  }
}
