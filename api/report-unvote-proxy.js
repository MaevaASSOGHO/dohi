// api/report-unvote-proxy.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const reportId = body.reportId;

    if (!reportId) {
      return res.status(400).json({ message: "reportId requis" });
    }

    const headers = {
      Accept: "application/json",
    };

    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }

    const url = `https://dohi.chat-mabelle.com/api/reports/${encodeURIComponent(
      reportId
    )}/vote`;

    const apiResponse = await fetch(url, {
      method: "DELETE",
      headers,
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
    console.error("Proxy report-unvote error:", error);
    res.status(500).json({
      message: "Proxy error",
      error: error.message || String(error),
    });
  }
}
