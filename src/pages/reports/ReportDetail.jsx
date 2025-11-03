// src/pages/reports/ReportDetail.jsx
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import InlineComments from "../../components/feed/InlineComments";
import { useRef, useState, useEffect } from "react";
import { statusLabel, statusBadgeClass } from "../../lib/reportStatus";

// Icônes
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

// Tooltip
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
  if (j > 14) return d.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "numeric" });
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

  // Normalisation
  const title       = r?.title ?? r?.entityName ?? r?.type ?? "Entité";
  const category    = r?.category ?? r?.category_name ?? "Non classé";
  const at          = r?.at ?? r?.created_at ?? r?.createdAt;
  const description = r?.description ?? r?.excerpt ?? "";
  const statusTxt   = r?.status || "new";

  // Attachments
  const attachments =
    (r?.attachments && r.attachments.length
      ? r.attachments
      : (r?.case?.evidences || []).map(ev => ({
          url: ev?.url || ev?.path || "",
          thumbUrl: ev?.thumb_url || ev?.thumbUrl || null,
        }))
    ) || [];

  const [openComments, setOpenComments] = useState(autoTabComments);
  useEffect(() => { if (autoTabComments) setOpenComments(true); }, [autoTabComments]);

  // ───────── Carrousel adaptatif (hauteur selon ratio courant)
  const railRef = useRef(null);
  const wrapRef = useRef(null);
  const [dims, setDims] = useState([]);     // [{ratio}]
  const [idx, setIdx] = useState(0);
  const [hPx, setHPx] = useState(0);

  // Charge les dimensions réelles
  useEffect(() => {
    let cancelled = false;
    const list = (attachments || []).map(a => a?.thumbUrl || a?.url).filter(Boolean);
    const loaders = list.map(src => new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve({ ratio: img.naturalWidth / img.naturalHeight || 1 });
      img.onerror = () => resolve({ ratio: 1 });
      img.src = src;
    }));
    Promise.all(loaders).then(arr => { if (!cancelled) setDims(arr); });
    return () => { cancelled = true; };
  }, [attachments]);

  const recalcHeight = () => {
    const wrap = wrapRef.current;
    if (!wrap || !dims[idx]) return;
    const vw = wrap.clientWidth;
    const ratio = dims[idx].ratio > 0 ? dims[idx].ratio : 16/9;
    let ideal = vw / ratio;                 // h = w / (w/h)
    // clamp en vh pour éviter des images gigantesques ou ridicules
    const vh = Math.max(1, window.innerHeight);
    const minPx = 0.42 * vh;               // 42vh
    const maxPx = 0.86 * vh;               // 86vh
    ideal = Math.min(Math.max(ideal, minPx), maxPx);
    setHPx(ideal);
  };

  useEffect(() => { recalcHeight(); /* eslint-disable-next-line */ }, [idx, dims]);
  useEffect(() => {
    const onResize = () => recalcHeight();
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(onResize);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => { window.removeEventListener("resize", onResize); ro.disconnect(); };
    // eslint-disable-next-line
  }, []);

  const onScroll = () => {
    const el = railRef.current, wrap = wrapRef.current;
    if (!el || !wrap) return;
    const w = Math.max(1, wrap.clientWidth);
    const next = Math.round(el.scrollLeft / w);
    if (next !== idx) setIdx(Math.max(0, Math.min((attachments?.length || 1) - 1, next)));
  };

  const scroll = (dir) => {
    const el = railRef.current, wrap = wrapRef.current;
    if (!el || !wrap) return;
    el.scrollBy({ left: (dir>0?1:-1) * wrap.clientWidth, behavior: "smooth" });
  };

  // ───────── Votes
  const stored = reportId ? localStorage.getItem(`vote:${reportId}`) : null;
  const [myVote, setMyVote] = useState(stored === 'u' ? 'u' : stored === 'n' ? 'n' : null);
  const [useful, setUseful] = useState(r?.usefulCount ?? r?.upvotes_count ?? r?.upvotes ?? 0);
  const [notUseful, setNotUseful] = useState(r?.notUsefulCount ?? r?.downvotes_count ?? r?.downvotes ?? 0);

  useEffect(() => {
    if (!r) return;
    setUseful(r?.usefulCount ?? r?.upvotes_count ?? r?.upvotes ?? 0);
    setNotUseful(r?.notUsefulCount ?? r?.downvotes_count ?? r?.downvotes ?? 0);
    // eslint-disable-next-line
  }, [r?.usefulCount, r?.notUsefulCount, r?.upvotes_count, r?.downvotes_count]);

  async function doVote(wantedUseful) {
    if (!reportId) return;
    if ((myVote==='u' && wantedUseful) || (myVote==='n' && !wantedUseful)) {
      const prevU=useful, prevN=notUseful, prevMy=myVote;
      if (myVote==='u') setUseful(u=>Math.max(0,u-1));
      if (myVote==='n') setNotUseful(n=>Math.max(0,n-1));
      setMyVote(null);
      try { await api.delete(`/reports/${reportId}/vote`); localStorage.removeItem(`vote:${reportId}`); }
      catch(e){ setUseful(prevU); setNotUseful(prevN); setMyVote(prevMy); }
      return;
    }
    if (myVote==null) {
      const prevU=useful, prevN=notUseful;
      if (wantedUseful) setUseful(u=>u+1); else setNotUseful(n=>n+1);
      setMyVote(wantedUseful?'u':'n');
      try { await api.post(`/reports/${reportId}/vote`, { useful: wantedUseful }); localStorage.setItem(`vote:${reportId}`, wantedUseful?'u':'n'); }
      catch(e){ setUseful(prevU); setNotUseful(prevN); setMyVote(null); }
    }
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
      {/* Bloc média (ADAPTATIF) */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-800">
        {/* Titre + catégorie + statut */}
        <div className="absolute left-0 top-0 z-10 m-2 flex items-center gap-2 rounded-full bg-black/60 px-2 py-1">
          <button onClick={() => navigate(`/?entity=${encodeURIComponent(title)}`)} className="text-sm font-semibold hover:underline">
            {title}
          </button>
          <span className="text-[10px] uppercase tracking-wide rounded-full bg-neutral-900/70 px-2 py-0.5 border border-neutral-800">
            {category}
          </span>
          <span className={`text-[10px] uppercase tracking-wide rounded-full px-2 py-0.5 border ${statusBadgeClass(statusTxt)}`}>
            {statusLabel(statusTxt)}
          </span>
        </div>

        {/* Wrapper dont la hauteur s'ajuste à l'image courante */}
        <div
          ref={wrapRef}
          className="relative w-full bg-black transition-[height] duration-200 ease-out"
          style={{ height: hPx ? `${hPx}px` : undefined }}
        >
          {attachments.length > 0 ? (
            <>
              <button onClick={()=>scroll(-1)} className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-1 hover:bg-black/70">‹</button>
              <button onClick={()=>scroll(1)}  className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-1 hover:bg-black/70">›</button>

              {/* Rail horizontal : hauteur = celle du wrapper (pas d'espace vide) */}
              <div
                ref={railRef}
                onScroll={onScroll}
                className="w-full h-full overflow-x-auto overflow-y-hidden whitespace-nowrap scroll-smooth snap-x snap-mandatory"
              >
                {attachments.map((att, i) => {
                  const src = att?.thumbUrl || att?.url || "";
                  return (
                    <div key={i} className="inline-block w-full h-full align-top snap-start">
                      {src ? (
                        <img
                          src={src}
                          alt=""
                          className="block w-full h-full object-contain bg-black"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="grid w-full h-full place-items-center text-neutral-500 bg-neutral-900">Média</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="grid w-full aspect-video place-items-center bg-neutral-900 text-neutral-500">
              Aucun média
            </div>
          )}

          {/* Horodatage */}
          <div className="absolute bottom-0 right-0 m-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-neutral-200">
            {timeAgo(at)}
          </div>
        </div>
      </div>

      {/* Description */}
      {description && (
        <div className="rounded-2xl border border-neutral-800 p-4 bg-neutral-950/60 text-neutral-100">
          {description}
        </div>
      )}

      {/* Barre d’actions */}
      <div className="flex items-center gap-5 px-1 text-sm">
        <span className="mx-1 h-4 w-px bg-neutral-800" />
        <Tip label={myVote==='u' ? "Cliquer pour annuler" : "Vote utile"}>
          <button onClick={()=>doVote(true)} disabled={!reportId} className={`flex items-center gap-1 hover:text-white ${myVote==='u' ? 'text-violet-400' : ''}`}>
            <IconThumbUp width="18" height="18" active={myVote==='u'} />
            <span>{useful}</span>
          </button>
        </Tip>
        <Tip label={myVote==='n' ? "Cliquer pour annuler" : "Vote pas utile"}>
          <button onClick={()=>doVote(false)} disabled={!reportId} className={`flex items-center gap-1 hover:text-white ${myVote==='n' ? 'text-violet-400' : ''}`}>
            <IconThumbDown width="18" height="18" active={myVote==='n'} />
            <span>{notUseful}</span>
          </button>
        </Tip>
        <span className="mx-1 h-4 w-px bg-neutral-800" />
        <Tip label={`${commentsCnt} commentaires`}>
          <button onClick={() => setOpenComments(true)} className="flex items-center gap-1 hover:text-white" disabled={!reportId}>
            <IconComment width="18" height="18" />
            <span>{commentsCnt}</span>
          </button>
        </Tip>
        <span className="ml-auto text-xs text-neutral-500" />
        <Tip label="Ajouter un signalement">
          <button type="button" onClick={goAddToThisCase} className="flex items-center gap-1 hover:text-white">
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
