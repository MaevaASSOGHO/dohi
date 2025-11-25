// api/reports-evidence-proxy.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { reportId } = req.query || {};
    if (!reportId) {
      return res
        .status(400)
        .json({ message: "reportId manquant dans la query" });
    }

    const targetUrl = `https://dohi.chat-mabelle.com/api/reports/${encodeURIComponent(
      reportId
    )}/evidence`;

    // 1) Lire tout le body (multipart) en Buffer
    const bodyBuffer = await new Promise((resolve, reject) => {
      const chunks = [];
      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", () => resolve(Buffer.concat(chunks)));
      req.on("error", (err) => reject(err));
    });

    // 2) Préparer les headers vers Laravel
    const headers = {
      Accept: "application/json",
      // On garde EXACTEMENT le content-type avec boundary
      "Content-Type":
        req.headers["content-type"] || "application/octet-stream",
    };
    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }

    // 3) Forward vers Laravel
    const upstream = await fetch(targetUrl, {
      method: "POST",
      headers,
      body: bodyBuffer,
    });

    const status = upstream.status;
    const contentType =
      upstream.headers.get("content-type") || "application/json";

    // 4) Lire la réponse de Laravel
    const arrayBuf = await upstream.arrayBuffer();
    const buf = Buffer.from(arrayBuf);

    // Si Laravel renvoie une erreur (4xx/5xx), on renvoie quand même le body
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
