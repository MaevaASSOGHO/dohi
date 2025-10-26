// src/components/feed/PostCard.jsx
import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import InlineComments from "./InlineComments";

// Icônes inline (SVG) — inchangé
const IconReport = (p)=>(<svg {...p} viewBox="0 0 24 24" fill="none"><path d="M6 3h12l1 3v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V3z" stroke="currentColor" strokeWidth="1.5"/><path d="M9 7h6M9 11h6M9 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>);
const IconShield = (p)=>(<svg {...p} viewBox="0 0 24 24" fill="none"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" stroke="currentColor" strokeWidth="1.5"/><path d="M9.5 12.5l2 2 3.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const IconThumbUp = (p)=>(<svg {...p} viewBox="0 0 24 24" fill="none"><path d="M7 10v10H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h3z" stroke="currentColor" strokeWidth="1.5"/><path d="M7 10s3-6 5-6 1 3 1 3h4a3 3 0 0 1 3 3l-1 6a3 3 0 0 1-3 3H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>);
const IconThumbDown = (p)=>(<svg {...p} viewBox="0 0 24 24" fill="none" style={{transform:"scaleY(-1)"}}><path d="M7 10v10H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h3z" stroke="currentColor" strokeWidth="1.5"/><path d="M7 10s3-6 5-6 1 3 1 3h4a3 3 0 0 1 3 3l-1 6a3 3 0 0 1-3 3H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>);
const IconComment = (p)=>(<svg {...p} viewBox="0 0 24 24" fill="none"><path d="M4 6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H9l-5 5V6z" stroke="currentColor" strokeWidth="1.5"/></svg>);

// Date hybride : relatif < 14j, sinon JJ/MM/AAAA
function timeLabel(iso) {
  const d = iso ? new Date(iso) : new Date();
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  const days = Math.floor(diffSec / 86400);
  if (days >= 14) {
    return d.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "numeric" });
  }
  if (diffSec < 60) return `il y a ${diffSec}s`;
  const m = Math.floor(diffSec / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${days} j`;
}

export default function PostCard({ item, onVote }) {
  const navigate = useNavigate();
  const [openComments, setOpenComments] = useState(false);

  // ID robuste (r-27 → 27)
  const rawId = item?.reportId ?? item?.id ?? item?.report_id ?? null;
  const reportId = typeof rawId === "string"
    ? (rawId.startsWith("r-") ? Number(rawId.slice(2)) : Number(rawId)) || null
    : (typeof rawId === "number" ? rawId : null);

  // Données affichées
  const entityName = item.entityName || item.entity?.name || (item.type ?? "Entité");
  const category   = item.category   || item.type || "Non classé";
  const verified   = !!(item.verified || item.status === "validated");
  const at         = item.at || new Date().toISOString();

  // Médias / rail
  const media = Array.isArray(item.attachments) ? item.attachments : [];
  const railRef = useRef(null);
  const [_, setTick] = useState(0);
  const scrollRight = () => { const el=railRef.current; if(!el) return; el.scrollBy({left: el.clientWidth*0.9, behavior:"smooth"}); setTimeout(()=>setTick(t=>t+1),250); };
  const scrollLeft  = () => { const el=railRef.current; if(!el) return; el.scrollBy({left:-el.clientWidth*0.9, behavior:"smooth"}); setTimeout(()=>setTick(t=>t+1),250); };

  // Compteurs → utilise les valeurs API (persistance)
  const reportsCnt   = item.reportsCount ?? item.counts?.reports ?? 1;
  const validCnt     = item.validationsCount ?? item.counts?.validations ?? 0;
  const usefulCnt    = item.usefulCount ?? item.votes?.useful ?? 0;
  const notUsefulCnt = item.notUsefulCount ?? item.votes?.notUseful ?? 0;
  const commentsCnt  = item.commentsCount ?? item.counts?.comments ?? 0;

  // State local pour vote optimiste
  const [localVotes, setLocalVotes] = useState({ 
    useful: usefulCnt, 
    notUseful: notUsefulCnt 
  });

  async function vote(useful) {
    if (!reportId) return;
    
    // Mise à jour optimiste immédiate
    const newVotes = useful 
      ? { useful: localVotes.useful + 1, notUseful: localVotes.notUseful }
      : { useful: localVotes.useful, notUseful: localVotes.notUseful + 1 };
    
    setLocalVotes(newVotes);

    try {
      await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000/api"}/reports/${reportId}/vote`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${localStorage.getItem("token")||""}` 
        },
        body: JSON.stringify({ useful })
      });
      
      // Notifier le parent que le vote a réussi pour mise à jour des données
      if (onVote) {
        onVote(reportId, newVotes);
      }
    } catch {
      // En cas d'erreur, on revert
      setLocalVotes({ useful: usefulCnt, notUseful: notUsefulCnt });
    }
  }

  // Tooltip mini
  const Tip = ({label, children}) => (
    <div className="relative group inline-flex items-center">
      {children}
      <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded-md bg-black/80 px-2 py-0.5 text-[10px] text-neutral-200 opacity-0 transition-opacity group-hover:opacity-100">
        {label}
      </div>
    </div>
  );

  // Navigation image → détails
  const openDetails = () => {
    if (reportId) navigate(`/reports/${reportId}`);
  };

  return (
    <article className="space-y-2">
      {/* Média + overlays */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-800">
        <div className="absolute left-0 top-0 z-10 m-2 flex items-center gap-2 rounded-full bg-black/60 px-2 py-1">
          <button onClick={() => navigate(`/?entity=${encodeURIComponent(entityName)}`)} className="text-sm font-semibold hover:underline">
            {entityName}
          </button>
          <span className="text-[10px] uppercase tracking-wide rounded-full bg-neutral-900/70 px-2 py-0.5 border border-neutral-800">
            {category}
          </span>
          {verified && (
            <span className="text-[10px] uppercase tracking-wide rounded-full bg-emerald-900/40 px-2 py-0.5 border border-emerald-800 text-emerald-100">
              Vérifié
            </span>
          )}
        </div>

        {/* Rail horizontal */}
        <button onClick={scrollLeft} className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-1 hover:bg-black/70">‹</button>
        <button onClick={scrollRight} className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-1 hover:bg-black/70">›</button>

        <div ref={railRef} className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth">
          {(media.length ? media : [{url:null}]).map((att, i) => (
            <div key={i} className="snap-start shrink-0 w-full aspect-video bg-neutral-900">
              {att.url ? (
                <button type="button" onClick={openDetails} className="block h-full w-full">
                  <img src={att.thumbUrl || att.url} alt="" className="h-full w-full object-cover" />
                </button>
              ) : (
                <div className="grid h-full w-full place-items-center text-neutral-500">Aucun média</div>
              )}
            </div>
          ))}
        </div>

        <div className="absolute bottom-0 right-0 m-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-neutral-200">
          {timeLabel(at)}
        </div>
      </div>

      {/* Barre d'actions : icônes + chiffres */}
      <div className="flex items-center gap-5 px-1 text-sm">
        <Tip label={`${reportsCnt} signalisations`}>
          <button onClick={() => navigate(`/?entity=${encodeURIComponent(entityName)}`)} className="flex items-center gap-1 hover:text-white">
            <IconReport width="18" height="18" />
            <span>{reportsCnt}</span>
          </button>
        </Tip>

        <Tip label={`${validCnt} validations`}>
          <button onClick={() => navigate(`/?q=${encodeURIComponent(entityName)}&status=validated`)} className="flex items-center gap-1 hover:text-white">
            <IconShield width="18" height="18" />
            <span>{validCnt}</span>
          </button>
        </Tip>

        <span className="mx-1 h-4 w-px bg-neutral-800" />

        <Tip label="Vote utile">
          <button onClick={()=>vote(true)} className="flex items-center gap-1 hover:text-white" disabled={!reportId}>
            <IconThumbUp width="18" height="18" />
            <span>{localVotes.useful}</span>
          </button>
        </Tip>

        <Tip label="Vote pas utile">
          <button onClick={()=>vote(false)} className="flex items-center gap-1 hover:text-white" disabled={!reportId}>
            <IconThumbDown width="18" height="18" />
            <span>{localVotes.notUseful}</span>
          </button>
        </Tip>

        <span className="mx-1 h-4 w-px bg-neutral-800" />

        <Tip label={`${commentsCnt} commentaires`}>
          <button
            onClick={() => setOpenComments(v=>!v)}
            className="flex items-center gap-1 hover:text-white"
            disabled={!reportId}
          >
            <IconComment width="18" height="18" />
            <span>{commentsCnt}</span>
          </button>
        </Tip>

        <span className="ml-auto text-xs text-neutral-500" />
      </div>

      {/* Commentaires inline */}
      {openComments && reportId ? (
        <InlineComments reportId={reportId} onClose={() => setOpenComments(false)} />
      ) : null}
    </article>
  );
}