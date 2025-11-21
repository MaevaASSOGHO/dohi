export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const payload =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

    const apiResponse = await fetch("https://dohi.chat-mabelle.com/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
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
    console.error("Proxy register error:", error);
    res.status(500).json({
      message: "Proxy error",
      error: error.message || String(error),
    });
  }
}
