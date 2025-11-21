export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const headers = {
      Accept: "application/json",
    };
    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }

    const apiResponse = await fetch("https://dohi.chat-mabelle.com/api/logout", {
      method: "POST",
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
    console.error("Proxy logout error:", error);
    res.status(500).json({
      message: "Proxy error",
      error: error.message || String(error),
    });
  }
}
