// api/report-vote-proxy.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

    const reportId = body.reportId;
    const useful = body.useful;

    if (!reportId || typeof useful === "undefined") {
      return res
        .status(400)
        .json({ message: "reportId et useful sont requis" });
    }

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    // Forward du Bearer token pour que Laravel sache qui vote
    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }

    const url = `https://dohi.chat-mabelle.com/api/reports/${encodeURIComponent(
      reportId
    )}/vote`;

    const apiResponse = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ useful }),
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
    console.error("Proxy report-vote error:", error);
    res.status(500).json({
      message: "Proxy error",
      error: error.message || String(error),
    });
  }
}
