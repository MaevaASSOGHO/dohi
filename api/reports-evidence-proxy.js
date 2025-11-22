// api/reports-evidence-proxy.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { reportId } = req.query || {};
    if (!reportId) {
      return res.status(400).json({ message: "reportId manquant dans la query" });
    }

    const targetUrl = `https://dohi.chat-mabelle.com/api/reports/${encodeURIComponent(
      reportId
    )}/evidence`;

    // 1) On lit TOUT le body (multipart) dans un Buffer
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const bodyBuffer = Buffer.concat(chunks);

    // 2) On prépare les headers vers Laravel
    const headers = {
      Accept: "application/json",
      // On garde exactement le content-type (avec la boundary)
      "Content-Type": req.headers["content-type"] || "application/octet-stream",
    };
    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }

    // 3) On forward vers Laravel
    const upstream = await fetch(targetUrl, {
      method: "POST",
      headers,
      body: bodyBuffer,
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
