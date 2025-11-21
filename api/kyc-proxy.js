// api/kyc-proxy.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed" });
  }

  const ctype = (req.headers["content-type"] || "").toLowerCase();
  const isMultipart = ctype.startsWith("multipart/form-data");

  try {
    // 1) SUBMIT KYC : multipart/form-data
    if (isMultipart) {
      const headers = {
        "Content-Type": req.headers["content-type"],
        Accept: "application/json",
      };
      if (req.headers.authorization) {
        headers.Authorization = req.headers.authorization;
      }

      const upstream = await fetch("https://dohi.chat-mabelle.com/api/kyc", {
        method: "POST",
        headers,
        body: req, // on stream le body brut (FormData)
      });

      const contentType =
        upstream.headers.get("content-type") || "application/json";
      const status = upstream.status;
      const arrayBuf = await upstream.arrayBuffer();

      res.status(status);
      res.setHeader("content-type", contentType);
      return res.send(Buffer.from(arrayBuf));
    }

    // 2) ACTIONS JSON : cancel / signed-url
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

    if (action === "signed-url") {
      const { path, ttl } = body;
      if (!path) {
        return res.status(400).json({ message: "path requis pour signed-url" });
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

    return res.status(400).json({
      message: "action invalide (multipart=submit, ou JSON: cancel / signed-url)",
    });
  } catch (error) {
    console.error("Proxy kyc error:", error);
    res.status(500).json({
      message: "Proxy error",
      error: error.message || String(error),
    });
  }
}
