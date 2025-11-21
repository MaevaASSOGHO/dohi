// api/notifications-read-all-proxy.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }

    const upstream = await fetch(
      "https://dohi.chat-mabelle.com/api/notifications/read-all",
      {
        method: "POST",
        headers,
        body: JSON.stringify({}), // pas de payload particulier
      }
    );

    const text = await upstream.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    res.status(upstream.status).json(data);
  } catch (error) {
    console.error("Proxy notifications-read-all error:", error);
    res.status(500).json({
      message: "Proxy error",
      error: error.message || String(error),
    });
  }
}
