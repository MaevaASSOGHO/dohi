import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { Link } from "react-router-dom";

const badgeClass = (s) =>
  s === "validated" ? "text-emerald-300" :
  s === "rejected"  ? "text-red-300" :
  "text-yellow-200";

export default function ModerationPanel() {
  const [items, setItems] = useState(null);

  useEffect(() => {
    api.get("/me/moderation").then(res => setItems(res.data?.items || []));
  }, []);

  if (!items) return <div>Chargement…</div>;
  if (items.length === 0) return <div className="text-sm text-neutral-400">Aucune décision pour le moment.</div>;

  return (
    <div className="grid gap-3">
      {items.map((m, i) => (
        <div key={i} className="flex items-center justify-between rounded border border-neutral-800 p-3">
          <div className="min-w-0">
            <div className="truncate text-sm">
              Report&nbsp;<Link className="underline" to={`/reports/${m.report_id}`}>#{m.report_id}</Link>
            </div>
            {m.reason && <div className="text-xs text-neutral-400">Motif : {m.reason}</div>}
          </div>
          <div className={`text-xs uppercase ${badgeClass(m.status)}`}>{m.status || "in_review"}</div>
        </div>
      ))}
    </div>
  );
}
