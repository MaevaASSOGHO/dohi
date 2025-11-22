// api/reports-evidence-proxy.js

export default async function handler(req, res) {
  // On n'accepte que POST
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // reportId passé en query : /api/reports-evidence-proxy?reportId=16
    const { reportId } = req.query || {};
    if (!reportId) {
      return res.status(400).json({ message: "reportId manquant dans la query" });
    }

    // On forward TOUT le body (FormData) tel quel vers Laravel
    const targetUrl = `https://dohi.chat-mabelle.com/api/reports/${encodeURIComponent(
      reportId
    )}/evidence`;

    // On reconstruit les headers utiles vers le backend
    const headers = {
      Accept: "application/json",
      "Content-Type": req.headers["content-type"] || "application/octet-stream",
    };

    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }

    // IMPORTANT : on passe req (stream) comme body → on ne touche pas au FormData
    const upstream = await fetch(targetUrl, {
      method: "POST",
      headers,
      body: req,
    });

    const status = upstream.status;
    const contentType =
      upstream.headers.get("content-type") || "application/json";
    const arrayBuf = await upstream.arrayBuffer();
    const buf = Buffer.from(arrayBuf);

    res.status(status);
    res.setHeader("content-type", contentType);
    return res.send(buf);
  } catch (error) {
    console.error("reports-evidence-proxy error:", error);
    return res.status(500).json({
      message: "Proxy error (reports-evidence)",
      error: error?.message || String(error),
    });
  }
}
