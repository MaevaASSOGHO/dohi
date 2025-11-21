// api/proxy/[...path].js

export default async function handler(req, res) {
  const { path = [] } = req.query; // catch-all param
  const segments = Array.isArray(path) ? path : [path];
  const targetPath = segments.join("/");

  // Reconstruire la query string (en enlevant 'path')
  const { path: _ignored, ...restQuery } = req.query;
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(restQuery)) {
    if (Array.isArray(value)) {
      value.forEach((v) => searchParams.append(key, v));
    } else if (value != null) {
      searchParams.append(key, value);
    }
  }
  const qs = searchParams.toString();
  const url = `https://dohi.chat-mabelle.com/api/${targetPath}${qs ? `?${qs}` : ""}`;

  const method = req.method || "GET";

  // Préparer les headers pour le backend
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  // Passer le Bearer token s'il existe
  if (req.headers.authorization) {
    headers.Authorization = req.headers.authorization;
  }

  // Body : seulement pour POST/PUT/PATCH/DELETE
  let body;
  if (!["GET", "HEAD"].includes(method.toUpperCase())) {
    const raw = req.body;
    if (raw && typeof raw === "object") {
      body = JSON.stringify(raw);
    } else if (typeof raw === "string") {
      body = raw;
    } else {
      body = undefined;
    }
  }

  try {
    const resp = await fetch(url, {
      method,
      headers,
      body,
    });

    const text = await resp.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    res.status(resp.status).json(data);
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({
      message: "Proxy error",
      error: error.message || String(error),
    });
  }
}
