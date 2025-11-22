// api/kyc-proxy.js

export default async function handler(req, res) {
  const method = req.method;
  const ctype = (req.headers["content-type"] || "").toLowerCase();
  const isMultipart = ctype.startsWith("multipart/form-data");

  try {
    // 1) SUBMIT KYC (upload fichier) → multipart/form-data
    if (method === "POST" && isMultipart) {
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

    // 2) CANCEL KYC sans body → DELETE direct
    if (method === "DELETE") {
      const headers = {
        Accept: "application/json",
      };
      if (req.headers.authorization) {
        headers.Authorization = req.headers.authorization;
      }

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

    // 3) JSON (signed-url ou éventuellement cancel via JSON)
    if (method === "POST" && !isMultipart) {
      let raw = "";
      for await (const chunk of req) {
        raw += chunk;
      }

      let body = {};
      if (raw) {
        try {
          body = JSON.parse(raw);
        } catch (e) {
          console.error("KYC proxy JSON parse error:", e);
          return res.status(400).json({ message: "JSON invalide", raw });
        }
      }

      const { action, path, ttl, cancel } = body;

      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      if (req.headers.authorization) {
        headers.Authorization = req.headers.authorization;
      }

      // 3.a) Signed URL
      // - soit action === "signed-url"
      // - soit pas d'action mais un path est présent (ton cas actuel)
      if (action === "signed-url" || (!action && path)) {
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

      // 3.b) Cancel via JSON éventuel
      if (action === "cancel" || cancel === true) {
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

      // 3.c) Rien ne match → on renvoie un message explicite
      return res.status(400).json({
        message:
          "Requête KYC JSON non reconnue. Pour signed-url: body avec { path, ttl? }. Pour cancel: { action:'cancel' } ou { cancel:true }.",
        received: body,
      });
    }

    // 4) Method non gérée
    res.setHeader("Allow", "POST, DELETE");
    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("Proxy kyc error:", error);
    return res.status(500).json({
      message: "Proxy error",
      error: error?.message || String(error),
    });
  }
}
