// api/report-comment-proxy.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

    const reportId = body.reportId;
    const kind = body.kind;
    const message = body.message;

    if (!reportId || !kind || !message) {
      return res
        .status(400)
        .json({ message: "reportId, kind et message sont requis" });
    }

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    // On forward le Bearer token si présent
    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }

    const url = `https://dohi.chat-mabelle.com/api/reports/${encodeURIComponent(
      reportId
    )}/comments`;

    const upstream = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ kind, message }),
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
    console.error("Proxy report-comment error:", error);
    res.status(500).json({
      message: "Proxy error",
      error: error.message || String(error),
    });
  }
}
