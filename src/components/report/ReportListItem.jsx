import { Link } from "react-router-dom";

export default function ReportListItem({ item }) {
  const title     = item.title || item.entityName || item.type || "Entité";
  const category  = item.category || item.type || null;
  const status    = item.status || "new";
  const updatedAt = item.updatedAt ? new Date(item.updatedAt) : null;
  const reports   = item.reportsCount ?? 1;
  const valids    = item.validationsCount ?? 0;
  const thumbUrl  = item.thumb?.url || null;

  const statusClasses =
    status === "validated" ? "text-emerald-300 border-emerald-800 bg-emerald-900/30" :
    status === "in_review" ? "text-yellow-200 border-yellow-800 bg-yellow-900/30" :
    status === "rejected"  ? "text-red-200 border-red-800 bg-red-900/30" :
                             "text-neutral-300 border-neutral-700 bg-neutral-900";

  return (
    <Link to={`/reports/${item.id}`} className="flex gap-3 rounded-xl border border-neutral-800 p-3 hover:bg-neutral-900/40">
      {/* vignette */}
      <div className="h-16 w-24 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 shrink-0">
        {thumbUrl
          ? <img src={thumbUrl} alt="" className="h-full w-full object-cover" />
          : <div className="grid h-full w-full place-items-center text-[10px] text-neutral-500">Aperçu</div>}
      </div>

      {/* texte */}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="font-medium truncate">{title}</span>
          {category && (
            <span className="text-[10px] uppercase tracking-wide rounded-full px-2 py-0.5 border border-neutral-800 bg-neutral-900/70">
              {category}
            </span>
          )}
          <span className={`text-[10px] uppercase tracking-wide rounded-full px-2 py-0.5 border ${statusClasses}`}>
            {status}
          </span>
        </div>

        {item.description && (
          <p className="text-sm text-neutral-200">
            {(item.description || '').slice(0, 200)}
            {item.description.length > 200 ? '…' : ''}
          </p>
        )}

        <div className="mt-1 flex items-center gap-3 text-xs text-neutral-400">
          <span>📝 {reports}</span>
          <span>🛡️ {valids}</span>
          <span>•</span>
          <span>{updatedAt ? updatedAt.toLocaleString() : ""}</span>
        </div>
      </div>
    </Link>
  );
}
