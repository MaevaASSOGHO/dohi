// src/pages/DebugData.jsx
import { useEffect, useState } from "react";
import api from "../lib/api";

export default function DebugData() {
  const [feed, setFeed] = useState(null);
  const [feedErr, setFeedErr] = useState("");
  const [disc, setDisc] = useState(null);
  const [discErr, setDiscErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get("/api/feed");
        setFeed(r.data);
      } catch (e) {
        setFeedErr(formatErr(e));
      }
      try {
        const r2 = await api.get("/api/discover");
        setDisc(r2.data);
      } catch (e) {
        setDiscErr(formatErr(e));
      }
    })();
  }, []);

  return (
    <main className="min-h-dvh p-6 text-white bg-black">
      <h1 className="text-2xl font-bold mb-4">Debug Données</h1>

      <Box title="GET /api/feed">
        {feed ? <pre className="text-xs">{JSON.stringify(feed, null, 2)}</pre>
              : <p className="text-red-400">{feedErr || "..."}</p>}
      </Box>

      <Box title="GET /api/discover">
        {disc ? <pre className="text-xs">{JSON.stringify(disc, null, 2)}</pre>
              : <p className="text-red-400">{discErr || "..."}</p>}
      </Box>
    </main>
  );
}

function Box({title, children}) {
  return (
    <div className="p-3 rounded-lg bg-neutral-900 ring-1 ring-neutral-800 mb-6">
      <div className="text-sm text-neutral-400 mb-2">{title}</div>
      {children}
    </div>
  );
}
function formatErr(e){
  const s = e?.response?.status ?? 'no-response';
  const u = e?.config?.baseURL + (e?.config?.url||"");
  const m = e?.message || "";
  const d = e?.response?.data ? JSON.stringify(e.response.data) : "";
  return `status=${s} url=${u} ${m} ${d}`;
}
