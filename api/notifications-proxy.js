// api/notifications-proxy.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
    const body = rawBody ? JSON.parse(rawBody || "{}") : {};
    const action = body.action;
    const ids = body.ids;

    let targetPath;
    let payload = {};

    if (action === "read-all") {
      targetPath = "/api/notifications/read-all";
      payload = {};
    } else if (action === "read") {
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "ids[] requis pour read" });
      }
      targetPath = "/api/notifications/read";
      payload = { ids };
    } else if (action === "unread") {
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "ids[] requis pour unread" });
      }
      targetPath = "/api/notifications/unread";
      payload = { ids };
    } else {
      return res.status(400).json({ message: "action invalide (read-all, read, unread)" });
    }

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }

    const upstream = await fetch(`https://dohi.chat-mabelle.com${targetPath}`, {
      method: "POST",
      headers,
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
    console.error("Proxy notifications error:", error);
    res.status(500).json({
      message: "Proxy error",
      error: error.message || String(error),
    });
  }
}
