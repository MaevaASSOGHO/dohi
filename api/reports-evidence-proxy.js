// api/reports-evidence-proxy.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed" });
  }

  // On attend un reportId dans la query : /api/reports-evidence-proxy?reportId=XXX
  const reportId = req.query.reportId || req.query.id;
  if (!reportId) {
    return res.status(400).json({ message: "reportId requis" });
  }

  try {
    // On reconstruit les headers minimums pour le backend
    const headers = {
      // Très important : on reprend exactement le content-type
      // (avec la boundary générée par Axios/FormData)
      "Content-Type": req.headers["content-type"] || "application/octet-stream",
      Accept: "application/json",
    };

    // On forward le Bearer token si présent
    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }

    const url = `https://dohi.chat-mabelle.com/api/reports/${encodeURIComponent(
      reportId
    )}/evidence`;

    // On envoie le flux brut (multipart/form-data) au backend Laravel
    const upstream = await fetch(url, {
      method: "POST",
      headers,
      body: req, // on ne touche PAS au body, on stream tel quel
    });

    const contentType =
      upstream.headers.get("content-type") || "application/json";
    const status = upstream.status;
    const arrayBuf = await upstream.arrayBuffer();

    res.status(status);
    res.setHeader("content-type", contentType);
    res.send(Buffer.from(arrayBuf));
  } catch (error) {
    console.error("Proxy reports-evidence error:", error);
    res.status(500).json({
      message: "Proxy error",
      error: error.message || String(error),
    });
  }
}
