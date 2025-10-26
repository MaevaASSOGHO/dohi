// src/pages/reports/ReportDetail.jsx
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import InlineComments from "../../components/feed/InlineComments";
import { useRef, useState, useEffect } from "react";
import { statusLabel, statusBadgeClass } from "../../lib/reportStatus";

// Icônes (stroke quand inactif, fill quand actif via currentColor)
const IconReport = (p)=>(<svg {...p} viewBox="0 0 24 24" fill="none"><path d="M6 3h12l1 3v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V3z" stroke="currentColor" strokeWidth="1.5"/><path d="M9 7h6M9 11h6M9 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>);
const IconShield = (p)=>(<svg {...p} viewBox="0 0 24 24" fill="none"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" stroke="currentColor" strokeWidth="1.5"/><path d="M9.5 12.5l2 2 3.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const IconThumbUp = ({active, ...p})=>(
  <svg {...p} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"}>
    <path d="M7 10v10H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h3z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M7 10s3-6 5-6 1 3 1 3h4a3 3 0 0 1 3 3l-1 6a3 3 0 0 1-3 3H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IconThumbDown = ({active, ...p})=>(
  <svg {...p} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} style={{transform:"scaleY(-1)"}}>
    <path d="M7 10v10H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h3z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M7 10s3-6 5-6 1 3 1 3h4a3 3 0 0 1 3 3l-1 6a3 3 0 0 1-3 3H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IconComment = (p)=>(<svg {...p} viewBox="0 0 24 24" fill="none"><path d="M4 6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H9l-5 5V6z" stroke="currentColor" strokeWidth="1.5"/></svg>);
const IconPlus = (p)=>(<svg {...p} viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>);

// Tooltip CSS-only
const Tip = ({label, children}) => (
  <div className="relative group inline-flex items-center">
    {children}
    <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded-md bg-black/80 px-2 py-0.5 text-[10px] text-neutral-200 opacity-0 transition-opacity group-hover:opacity-100">
      {label}
    </div>
  </div>
);

/* Date relative ≤14j, sinon JJ-MM-AAAA */
function timeAgo(iso){
  const d = new Date(iso || Date.now());
  const ms = Date.now() - d.getTime();
  if (!Number.isFinite(ms)) return "";
  const s  = Math.floor(ms / 1000);
  const j  = Math.floor(s / 86400);

  if (j > 14) {
    return d.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "numeric" });
  }
  if (s < 60) return `il y a ${s}s`;
  const m = Math.floor(s/60); if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m/60); if (h < 24) return `il y a ${h} h`;
  if (j < 30) return `il y a ${j} j`;
  const mo = Math.floor(j/30); if (mo < 12) return `il y a ${mo} mois`;
  const y = Math.floor(mo/12); return `il y a ${y} an${y>1?"s":""}`;
}

export default function ReportDetail() {
  const navigate = useNavigate();

  const { id: idParam } = useParams();
  const reportId = Number(idParam);
  const [searchParams] = useSearchParams();
  const autoTabComments = searchParams.get("tab") === "comments";

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["report", reportId],
    queryFn: async () => (await api.get(`/reports/${reportId}`)).data,
    enabled: Number.isFinite(reportId),
  });

  const r = data?.report;
  const entityName = r?.entityName ?? null;
  const canAdd = !!r;
  // Normalisation snake_case/camelCase
  const title = r?.title ?? r?.entityName ?? r?.type ?? "Entité";
  const category   = r?.category ?? r?.category_name ?? "Non classé";
  const verified   = !!(r?.verified ?? r?.is_verified);
  const at         = r?.at ?? r?.created_at ?? r?.createdAt;
  const description= r?.description ?? r?.excerpt ?? "";

  // Pièces jointes : soit déjà dans le report, soit via le case lié
 const attachments =
    (r?.attachments && r.attachments.length
      ? r.attachments
      : (r?.case?.evidences || [])
          .map(ev => ({
            url: ev?.url || ev?.path || "",
            thumbUrl: ev?.thumb_url || ev?.thumbUrl || null,
          }))
    ) || [];

  function goEntityReports() {
    if (!entityName) return;
    navigate(`/?entity=${encodeURIComponent(entityName)}`);
  }
  function goEntityValidations() {
    if (!entityName) return;
    navigate(`/?q=${encodeURIComponent(entityName)}&status=validated`);
  }

  const [openComments, setOpenComments] = useState(autoTabComments);
  useEffect(() => { if (autoTabComments) setOpenComments(true); }, [autoTabComments]);

  const statusTxt = data?.report?.status || "new";

  // Carrousel horizontal simple
  const railRef = useRef(null);
  const scroll = (dir)=>{ const el=railRef.current; if(!el) return; el.scrollBy({left: (dir>0?1:-1)*el.clientWidth*0.9, behavior:"smooth"}); };

  // ───────── Votes: 1 seul choix ; re-clic = annuler
  const stored = reportId ? localStorage.getItem(`vote:${reportId}`) : null; // 'u' | 'n' | null
  const [myVote, setMyVote] = useState(stored === 'u' ? 'u' : stored === 'n' ? 'n' : null);
  // Fallbacks pour différents noms de champs côté API
  const [useful, setUseful] = useState(
    r?.usefulCount ?? r?.upvotes_count ?? r?.upvotes ?? 0
  );
  const [notUseful, setNotUseful] = useState(
    r?.notUsefulCount ?? r?.downvotes_count ?? r?.downvotes ?? 0
  );

  // Resync si l’API renvoie d’autres chiffres
  useEffect(() => {
    if (!r) return;
    setUseful(r?.usefulCount ?? r?.upvotes_count ?? r?.upvotes ?? 0);
    setNotUseful(r?.notUsefulCount ?? r?.downvotes_count ?? r?.downvotes ?? 0);
  }, [r?.usefulCount, r?.notUsefulCount, r?.upvotes_count, r?.downvotes_count]); // eslint-disable-line

  async function doVote(wantedUseful) {
    if (!reportId) return;

    // Re-clic sur l’icône active → UNVOTE
    if ((myVote === 'u' && wantedUseful) || (myVote === 'n' && !wantedUseful)) {
      const prevU = useful, prevN = notUseful, prevMy = myVote;
      if (myVote === 'u') setUseful(u => Math.max(0, u - 1));
      if (myVote === 'n') setNotUseful(n => Math.max(0, n - 1));
      setMyVote(null);
      try {
        await api.delete(`/reports/${reportId}/vote`);
        localStorage.removeItem(`vote:${reportId}`);
      } catch (e) {
        // rollback
        setUseful(prevU); setNotUseful(prevN); setMyVote(prevMy);
        console.error("Unvote failed", e?.response || e);
      }
      return;
    }

    // Si pas encore voté → VOTE
    if (myVote == null) {
      const prevU = useful, prevN = notUseful;
      if (wantedUseful) setUseful(u => u + 1); else setNotUseful(n => n + 1);
      setMyVote(wantedUseful ? 'u' : 'n');
      try {
        await api.post(`/reports/${reportId}/vote`, { useful: wantedUseful });
        localStorage.setItem(`vote:${reportId}`, wantedUseful ? 'u' : 'n');
      } catch (e) {
        // rollback
        setUseful(prevU); setNotUseful(prevN); setMyVote(null);
        console.error("Vote failed", e?.response || e);
      }
      return;
    }

    // Déjà voté et l’utilisateur tente l’autre icône → on ignore (annuler d’abord)
    // (Tu peux activer un “switch automatique” ici si tu veux)
  }

  function goAddToThisCase() {
    if (!r) return;
    const pf = r.prefill ?? {
      caseId: r.caseId ?? null,
      title:  r.title ?? r.entityName ?? null,
      scenario: null,
      identifiers: {},
      category: r.category ?? null,
    };
    navigate("/reports/new", {
      state: { from: location.pathname, prefill: pf, forceStep: 3 },
      replace: false,
    });
  }

  const reportsCnt  = r?.reportsCount ?? 1;
  const validCnt    = r?.validationsCount ?? 0;
  const commentsCnt = r?.commentsCount ?? 0;

  if (isLoading) return <div className="p-4 text-sm text-neutral-400">Chargement…</div>;
  if (isError)   return (
    <div className="p-4 text-sm text-red-300">
      Impossible de charger le dossier{error?.response?.status?` (${error.response.status})`:""}.
      <button className="ml-2 underline" onClick={()=>refetch()}>Réessayer</button>
    </div>
  );
  if (!r) return <div className="p-4 text-sm text-neutral-400">Dossier introuvable.</div>;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-2">
      {/* Bloc média */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-800">
        {/* Titre + catégorie + statut */}
        <div className="absolute left-0 top-0 z-10 m-2 flex items-center gap-2 rounded-full bg-black/60 px-2 py-1">
          <button onClick={() => navigate(`/?entity=${encodeURIComponent(title)}`)} className="text-sm font-semibold hover:underline">
            {title}
          </button>
          <span className="text-[10px] uppercase tracking-wide rounded-full bg-neutral-900/70 px-2 py-0.5 border border-neutral-800">
            {category}
          </span>
            <span className={`text-[10px] uppercase tracking-wide rounded-full px-2 py-0.5 border ${statusBadgeClass(status)}`}>
              {statusLabel(statusTxt)}
            </span>
        </div>

        {attachments.length > 0 ? (
          <>
            <button onClick={()=>scroll(-1)} className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-1 hover:bg-black/70">‹</button>
            <button onClick={()=>scroll(1)}  className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-1 hover:bg-black/70">›</button>
            <div ref={railRef} className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth">
              {attachments.map((att, i) => (
                <div key={i} className="snap-start shrink-0 w-full aspect-video bg-neutral-900">
                  {att?.url
                    ? <img src={att.thumbUrl || att.url} alt="" className="h-full w-full object-cover" />
                    : <div className="grid h-full w-full place-items-center text-neutral-500">Média</div>}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="aspect-video grid place-items-center bg-neutral-900 text-neutral-500">
            Aucun média
          </div>
        )}

        <div className="absolute bottom-0 right-0 m-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-neutral-200">
          {timeAgo(at)}
        </div>
      </div>

      {/* Description */}
      {description && (
        <div className="rounded-2xl border border-neutral-800 p-4 bg-neutral-950/60 text-neutral-100">
          {description}
        </div>
      )}

      {/* Barre d’actions (style feed) */}
      <div className="flex items-center gap-5 px-1 text-sm">
        {/* <Tip label={`${reportsCnt} signalisations`}>
          <button onClick={goEntityReports} className="flex items-center gap-1 hover:text-white">
            <IconReport width="18" height="18" />
            <span>{reportsCnt}</span>
          </button>
        </Tip>

        <Tip label={`${validCnt} validations`}>
          <button onClick={goEntityValidations} className="flex items-center gap-1 hover:text-white">
            <IconShield width="18" height="18" />
            <span>{validCnt}</span>
          </button>
        </Tip> */}

        <span className="mx-1 h-4 w-px bg-neutral-800" />

        <Tip label={myVote==='u' ? "Cliquer pour annuler" : "Vote utile"}>
          <button
            onClick={()=>doVote(true)}
            disabled={!reportId}
            className={`flex items-center gap-1 hover:text-white ${myVote==='u' ? 'text-violet-400' : ''}`}
          >
            <IconThumbUp width="18" height="18" active={myVote==='u'} />
            <span>{useful}</span>
          </button>
        </Tip>

        <Tip label={myVote==='n' ? "Cliquer pour annuler" : "Vote pas utile"}>
          <button
            onClick={()=>doVote(false)}
            disabled={!reportId}
            className={`flex items-center gap-1 hover:text-white ${myVote==='n' ? 'text-violet-400' : ''}`}
          >
            <IconThumbDown width="18" height="18" active={myVote==='n'} />
            <span>{notUseful}</span>
          </button>
        </Tip>

        <span className="mx-1 h-4 w-px bg-neutral-800" />

        <Tip label={`${commentsCnt} commentaires`}>
          <button
            onClick={() => setOpenComments(true)}
            className="flex items-center gap-1 hover:text-white"
            disabled={!reportId}
          >
            <IconComment width="18" height="18" />
            <span>{commentsCnt}</span>
          </button>
        </Tip>

        <span className="ml-auto text-xs text-neutral-500" />

        <Tip label="Ajouter un signalement">
          <button
            type="button"
            onClick={goAddToThisCase}
            className="flex items-center gap-1 hover:text-white"
          >
            <IconPlus width="18" height="18" />
          </button>
        </Tip>

      </div>

      {/* Commentaires inline */}
      {openComments && (
        <InlineComments reportId={reportId} onClose={()=>setOpenComments(false)} />
      )}
    </div>
  );
}
