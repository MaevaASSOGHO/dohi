// src/components/feed/PostCard.jsx
import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import InlineComments from "./InlineComments";
import { statusLabel, statusBadgeClass } from "../../lib/reportStatus";
import UniformMedia from "./UniformMedia";

// Icônes inline (inchangées)
const IconThumbUp = ({ className = "", ...p }) => (
  <svg {...p} className={className} viewBox="0 0 24 24" fill="none">
    <path d="M7 10v10H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h3z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M7 10s3-6 5-6 1 3 1 3h4a3 3 0 0 1 3 3l-1 6a3 3 0 0 1-3 3H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IconThumbDown = ({ className = "", ...p }) => (
  <svg {...p} className={className} viewBox="0 0 24 24" fill="none" style={{ transform: "scaleY(-1)" }}>
    <path d="M7 10v10H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h3z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M7 10s3-6 5-6 1 3 1 3h4a3 3 0 0 1 3 3l-1 6a3 3 0 0 1-3 3H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IconComment = ({ className = "", ...p }) => (
  <svg {...p} className={className} viewBox="0 0 24 24" fill="none">
    <path d="M4 6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v7a3 3 0 0 1 3 3H9l-5 5V6z" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

// Date hybride
function timeLabel(iso) {
  const d = iso ? new Date(iso) : new Date();
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  const days = Math.floor(diffSec / 86400);
  if (days >= 14) return d.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "numeric" });
  if (diffSec < 60) return `il y a ${diffSec}s`;
  const m = Math.floor(diffSec / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${days} j`;
}

export default function PostCard({
  item,
  onVoteUseful,
  onVoteNotUseful,
  myVote,
}) {
  const navigate = useNavigate();
  const [openComments, setOpenComments] = useState(false);

  // ID robuste
  const rawId = item?.reportId ?? item?.id ?? item?.report_id ?? null;
  const reportId =
    typeof rawId === "string"
      ? (rawId.startsWith("r-") ? Number(rawId.slice(2)) : Number(rawId)) || null
      : typeof rawId === "number"
      ? rawId
      : null;

  // Données affichées
  const titleText = item?.title || item?.entityName || item?.type || "Entité";
  const category  = item?.category || item?.type || "Non classé";
  const status    = item?.status || "new";
  const at        = item?.at || new Date().toISOString();

  // Terme de recherche vers ReportsList (pas Discover)
  const searchQ = useMemo(
    () => (item ? (item.title || item.entityName || item.type || "").trim() : ""),
    [item]
  );
  const goSearchReports = () => {
    const params = new URLSearchParams();
    if (searchQ) params.set("q", searchQ);
    navigate({ pathname: "/reports", search: `?${params.toString()}` });
  };

  // Médias (on prend attachments/evidences/media)
  const pick = (a) => (Array.isArray(a) && a.length ? a : null);
  const rawMedia =
    pick(item?.attachments) ||
    pick(item?.evidences) ||
    pick(item?.case?.evidences) ||
    pick(item?.media) ||
    [];
  const images = rawMedia
    .map((ev) => ev?.thumbUrl || ev?.thumb_url || ev?.url || ev?.path || ev?.src)
    .filter(Boolean);

  // Compteurs
  const usefulCnt    = item?.usefulCount ?? item?.votes?.useful ?? 0;
  const notUsefulCnt = item?.notUsefulCount ?? item?.votes?.notUseful ?? 0;
  const commentsCnt  = item?.commentsCount ?? item?.counts?.comments ?? 0;

  // Tooltip
  const Tip = ({ label, children }) => (
    <div className="relative group inline-flex items-center">
      {children}
      <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded-md bg-white dark:bg-black/80 px-2 py-0.5 text-[10px] text-neutral-900 dark:text-neutral-200 opacity-0 transition-opacity group-hover:opacity-100 border border-neutral-200 dark:border-neutral-800">
        {label}
      </div>
    </div>
  );

  const openDetails = () => {
    if (reportId) navigate(`/reports/${reportId}`);
  };

  return (
    <article className="space-y-2">
      {/* Cadre média */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800">
        {/* Badges en haut-gauche (plus petits) */}
        <div className="absolute left-0 top-0 z-10 m-2 flex items-center gap-1.5 rounded-full bg-white/80 dark:bg-black/55 px-2 py-1 backdrop-blur-sm">
          <button
            type="button"
            onClick={goSearchReports}
            className="inline-flex items-center rounded border px-3 py-1 text-sm
                       border-neutral-300 text-neutral-700 hover:bg-neutral-50
                       dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
            title="Rechercher des rapports similaires"
            aria-label="Rechercher des rapports similaires"
          >
            {titleText}
          </button>
          <span className="text-[9px] uppercase tracking-wide rounded-full bg-neutral-100/70 dark:bg-neutral-900/70 px-1.5 py-0.5 border border-neutral-300 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300">
            {category}
          </span>
          <span className={`text-[9px] uppercase tracking-wide rounded-full px-1.5 py-0.5 border ${statusBadgeClass(status)}`}>
            {statusLabel(status)}
          </span>
        </div>

        {/* Image uniforme, sans scroll interne, responsive ratio */}
        <UniformMedia
          images={images}
          onClick={openDetails}
          aspectMobile="aspect-[4/3]"   // 📱 plus haut
          aspectDesktop="md:aspect-video" // 💻 s'élargit (16:9)
        />

        {/* Horodatage en bas-droite */}
        <div className="absolute bottom-0 right-0 m-2 rounded-full bg-white/80 dark:bg-black/60 px-2 py-0.5 text-[10px] text-neutral-700 dark:text-neutral-200 backdrop-blur-sm">
          {timeLabel(at)}
        </div>
      </div>

      {/* Barre d'actions */}
      <div className="flex items-center gap-5 px-1 text-sm text-neutral-600 dark:text-neutral-400">
        <span className="mx-1 h-4 w-px bg-neutral-300 dark:bg-neutral-700" />

        <Tip label="Vote utile">
          <button
            type="button"
            onClick={onVoteUseful}
            className={`flex items-center gap-1 hover:text-neutral-900 dark:hover:text-white ${myVote === "u" ? "text-violet-600 dark:text-violet-400" : ""}`}
            disabled={!reportId}
          >
            <IconThumbUp width="18" height="18" />
            <span>{usefulCnt}</span>
          </button>
        </Tip>

        <Tip label="Vote pas utile">
          <button
            type="button"
            onClick={onVoteNotUseful}
            className={`flex items-center gap-1 hover:text-neutral-900 dark:hover:text-white ${myVote === "n" ? "text-violet-600 dark:text-violet-400" : ""}`}
            disabled={!reportId}
          >
            <IconThumbDown width="18" height="18" />
            <span>{notUsefulCnt}</span>
          </button>
        </Tip>

        <span className="mx-1 h-4 w-px bg-neutral-300 dark:bg-neutral-700" />

        <Tip label={`${commentsCnt} commentaires`}>
          <button
            onClick={() => setOpenComments((v) => !v)}
            className="flex items-center gap-1 hover:text-neutral-900 dark:hover:text-white"
            disabled={!reportId}
          >
            <IconComment width="18" height="18" />
            <span>{commentsCnt}</span>
          </button>
        </Tip>

        <span className="ml-auto text-xs text-neutral-500 dark:text-neutral-500" />
      </div>

      {/* Commentaires inline */}
      {openComments && reportId ? (
        <InlineComments reportId={reportId} onClose={() => setOpenComments(false)} />
      ) : null}
    </article>
  );
}
