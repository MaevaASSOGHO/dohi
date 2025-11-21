// api/kyc-submit-proxy.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const headers = {
      // important : garder la boundary générée par le navigateur/axios
      "Content-Type": req.headers["content-type"] || "application/octet-stream",
      Accept: "application/json",
    };

    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }

    const upstream = await fetch("https://dohi.chat-mabelle.com/api/kyc", {
      method: "POST",
      headers,
      body: req, // on stream le body brut
    });

    const contentType =
      upstream.headers.get("content-type") || "application/json";
    const status = upstream.status;
    const arrayBuf = await upstream.arrayBuffer();

    res.status(status);
    res.setHeader("content-type", contentType);
    res.send(Buffer.from(arrayBuf));
  } catch (error) {
    console.error("Proxy kyc-submit error:", error);
    res.status(500).json({
      message: "Proxy error",
      error: error.message || String(error),
    });
  }
}
