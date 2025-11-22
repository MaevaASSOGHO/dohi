// api/kyc-proxy.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed" });
  }

  const ctype = (req.headers["content-type"] || "").toLowerCase();
  const isMultipart = ctype.startsWith("multipart/form-data");

  try {
    // 1) CAS MULTIPART = SUBMIT KYC (avec fichier)
    if (isMultipart) {
      // On lit tout le body dans un Buffer
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const bodyBuffer = Buffer.concat(chunks);

      const headers = {
        "Content-Type": req.headers["content-type"], // garde la boundary
        Accept: "application/json",
      };
      if (req.headers.authorization) {
        headers.Authorization = req.headers.authorization;
      }

      const upstream = await fetch("https://dohi.chat-mabelle.com/api/kyc", {
        method: "POST",
        headers,
        body: bodyBuffer,
      });

      const status = upstream.status;
      const contentType =
        upstream.headers.get("content-type") || "application/json";
      const arrayBuf = await upstream.arrayBuffer();

      res.status(status);
      res.setHeader("content-type", contentType);
      return res.send(Buffer.from(arrayBuf));
    }

    // 2) CAS JSON = cancel / signed-url
    const rawBody =
      typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
    const body = rawBody ? JSON.parse(rawBody || "{}") : {};
    const action = body.action;

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }

    // 2.a) Annuler le KYC
    if (action === "cancel") {
      const upstream = await fetch("https://dohi.chat-mabelle.com/api/kyc", {
        method: "DELETE",
        headers,
      });

      const text = await upstream.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
      return res.status(upstream.status).json(data);
    }

    // 2.b) Signed URL
    if (action === "signed-url") {
      const { path, ttl } = body;
      if (!path) {
        return res
          .status(400)
          .json({ message: "path requis pour signed-url" });
      }

      const upstream = await fetch(
        "https://dohi.chat-mabelle.com/api/kyc/signed-url",
        {
          method: "POST",
          headers,
          body: JSON.stringify({ path, ttl }),
        }
      );

      const text = await upstream.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
      return res.status(upstream.status).json(data);
    }

    // 2.c) Action inconnue
    return res.status(400).json({
      message:
        "action invalide (multipart = submit KYC, JSON: cancel / signed-url)",
    });
  } catch (error) {
    console.error("Proxy kyc error:", error);
    return res.status(500).json({
      message: "Proxy error",
      error: error?.message || String(error),
    });
  }
}
