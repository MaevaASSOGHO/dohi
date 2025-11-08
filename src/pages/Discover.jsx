// src/pages/Discover.jsx
import { useEffect, useMemo, useRef } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Link, useSearchParams } from "react-router-dom";
import ReportListItem from "./reports/ReportsList";

/** --- Config d’affichage de la grille --- */
const TILE_RATIO = "square";         // "square" (1:1) ou "3/4"
const TILE_FIT   = "cover";          // "cover" (style Instagram) ou "contain" (zéro crop)
const aspectClass = TILE_RATIO === "3/4" ? "aspect-[3/4]" : "aspect-square";
const USE_MANUAL_LOAD = true;

export default function Discover() {
  /** === Filtres (source = URL) === */
  const [searchParams, setSearchParams] = useSearchParams();
  const entity = searchParams.get("entity") || "";
  const q      = searchParams.get("q") || "";
  const status = searchParams.get("status") || ""; // "", "verified", "in_review"
  const category = searchParams.get("category") || "";
  const type     = searchParams.get("type") || "";
  const city     = searchParams.get("city") || "";
  const from     = searchParams.get("from") || "";
  const to       = searchParams.get("to") || "";

  const setParam = (k, v) => {
    const next = new URLSearchParams(searchParams);
    if (v) next.set(k, v); else next.delete(k);
    next.delete("page");
    setSearchParams(next, { replace: true });
  };

  const submitSearch = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setParam("q", (form.get("q") || "").toString());
  };

  /** === 1) (Optionnel) Agrégats — on les désactive si /discover est instable === */
  const enableAgg = false; // mets true si ton /api/discover est prêt
  const { data: agg, isLoading: aggLoading, error: aggError } = useQuery({
    queryKey: ["discover:aggregates"],
    queryFn: async () => {
      const res = await api.get("/discover", { params: { page: 1, pageSize: 1 } });
      return {
        trendingTypes: (res.data?.trendingTypes || []).slice(0, 4),
        hotKeywords: (res.data?.hotKeywords || []).slice(0, 6),
      };
    },
    enabled: enableAgg,
    staleTime: 30_000,
    retry: 0,
  });

  /** === 2a) MODE GRILLE : on lit /reports (car il fournit thumb.url) === */
  const GRID_PAGE_SIZE = 24;
  const {
    data: gridPages,
    isLoading: gridLoading,
    isFetchingNextPage: gridFetchingNext,
    fetchNextPage: gridFetchNext,
    hasNextPage: gridHasNext,
    error: gridError,
  } = useInfiniteQuery({
    queryKey: ["discover:grid", { status, category, type, city, from, to }],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.get("/reports", {
        params: { status, category, type, city, from, to, page: pageParam, pageSize: GRID_PAGE_SIZE },
      });
      const items = res.data?.items ?? [];
      const total = res.data?.total ?? 0;
      const hasMore = (pageParam * GRID_PAGE_SIZE) < total;
      return { items, nextPage: hasMore ? pageParam + 1 : undefined, total };
    },
    getNextPageParam: (last) => last?.nextPage,
    enabled: q.trim() === "",
    staleTime: 15_000,
    keepPreviousData: true,
  });
  const gridItems = useMemo(
    () => (gridPages?.pages ?? []).flatMap(p => p.items),
    [gridPages]
  );

  /** === 2b) MODE LISTE : résultats de recherche (quand q non vide) === */
  const LIST_PAGE_SIZE = 20;
  const {
    data: listPages,
    isLoading: listLoading,
    isFetchingNextPage: listFetchingNext,
    fetchNextPage: listFetchNext,
    hasNextPage: listHasNext,
    error: listError,
    refetch: listRefetch,
  } = useInfiniteQuery({
    queryKey: ["discover:list", { entity, q, status, category, type, city, from, to }],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.get("/reports", {
        params: { entity, q, status, category, type, city, from, to, page: pageParam, pageSize: LIST_PAGE_SIZE },
      });
      return {
        ...res.data,
        page: pageParam,
        hasMore: (pageParam * LIST_PAGE_SIZE) < (res.data?.total ?? 0),
      };
    },
    getNextPageParam: (last) => last?.hasMore ? (last.page + 1) : undefined,
    enabled: q.trim() !== "",
    staleTime: 15_000,
    keepPreviousData: true,
  });
  const listItems = useMemo(
    () => listPages?.pages?.flatMap((p) => p.items || []) ?? [],
    [listPages]
  );
  const listTotal = listPages?.pages?.[0]?.total ?? 0;

  /** === 3) IntersectionObserver pour le scroll infini (selon le mode) === */
  const sentinelRef = useRef(null);
  useEffect(() => {
    if (USE_MANUAL_LOAD) return; // ← on laisse le bouton gérer
    const el = sentinelRef.current;
    if (!el) return;

    const wantGrid = q.trim() === "";
    const canScroll = wantGrid ? gridHasNext : listHasNext;
    const onNext = wantGrid ? gridFetchNext : listFetchNext;
    if (!canScroll) return;

    const io = new IntersectionObserver((entries) => {
      const e = entries[0];
      if (e?.isIntersecting) onNext();
    }, { root: null, rootMargin: "200px" });

    io.observe(el);
    return () => io.disconnect();
  }, [q, gridHasNext, listHasNext, gridFetchNext, listFetchNext]);

  /** Utilitaire image: cover -> thumb -> evidences[0] */
  const pickImage = (r) =>
    r?.thumb?.url || r?.cover?.url ||
    (Array.isArray(r?.evidences) && r.evidences.length
      ? (r.evidences[0].thumb_url || r.evidences[0].url)
      : null);

  return (
    <div className="space-y-6">
      {/* Barre de recherche + filtres */}
      <form onSubmit={submitSearch} className="flex flex-wrap items-center gap-2">
        <input
          name="q"
          value={q}
          onChange={(e)=> setParam("q", e.target.value)}   // recherche en direct
          placeholder={entity ? `Recherche dans "${entity}"` : "Rechercher…"}
          className="min-w-0 flex-1 rounded border border-neutral-300 dark:border-neutral-700
                     bg-white dark:bg-neutral-900
                     text-neutral-900 dark:text-neutral-100
                     placeholder:text-neutral-400
                     px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-violet-500/40"
        />
        <div className="flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={()=>setParam("status","")}
            className={`rounded px-2 py-1 border ${
              status===""
                ? "bg-white text-black"
                : "border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900"
            } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40`}
          >
            Tous
          </button>

          <button
            type="button"
            onClick={()=>setParam("status","verified")}
            className={`rounded px-2 py-1 border ${
              status==="verified"
                ? "bg-white text-black"
                : "border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900"
            } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40`}
          >
            Vérifiés
          </button>

          <button
            type="button"
            onClick={()=>setParam("status","in_review")}
            className={`rounded px-2 py-1 border ${
              status==="in_review"
                ? "bg-white text-black"
                : "border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900"
            } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40`}
          >
            En revue
          </button>
        </div>

        {entity && (
          <div className="ml-auto text-xs text-neutral-600 dark:text-neutral-400">
            Entité : <span className="font-medium text-neutral-900 dark:text-neutral-200">{entity}</span>
            <button
              type="button"
              onClick={() => setParam("entity","")}
              className="ml-2 underline underline-offset-2 hover:opacity-80"
            >
              effacer
            </button>
          </div>
        )}
      </form>

      {/* —— MODE LISTE quand on cherche —— */}
      {q.trim() !== "" ? (
        <section className="space-y-3">
          {listError && (
            <div className="rounded border p-3 text-sm
                            border-yellow-300 bg-yellow-50 text-yellow-800
                            dark:border-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
              Erreur{listError?.response?.status?` (${listError.response.status})`:""}.
              <button onClick={()=>listRefetch()} className="ml-2 underline underline-offset-2 hover:opacity-80">Réessayer</button>
            </div>
          )}

          <div className="max-h-[70vh] overflow-auto space-y-2">
            {listLoading && !listItems.length && (
              <div className="rounded-xl border p-3 text-sm
                              border-neutral-300 text-neutral-600
                              dark:border-neutral-800 dark:text-neutral-400">
                Chargement…
              </div>
            )}

            {!listLoading && listItems.length === 0 && (
              <div className="rounded-xl border p-3 text-sm
                              border-neutral-300 text-neutral-600
                              dark:border-neutral-800 dark:text-neutral-400">
                Aucun signalement pour « {q} ».
              </div>
            )}

            {listItems.map((it) => <ReportListItem key={it.id} item={it} />)}

            <div ref={sentinelRef} />
            {(USE_MANUAL_LOAD || listHasNext) && (
              <div className="py-2 text-center">
                <button
                  disabled={!listHasNext || listFetchingNext}
                  onClick={()=>listFetchNext()}
                  className="rounded border px-3 py-1 text-sm
                             border-neutral-300 text-neutral-700 hover:bg-neutral-50
                             disabled:opacity-60
                             dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                >
                  {listFetchingNext ? "Chargement…" : (listHasNext ? "Voir plus" : "Fin de liste")}
                </button>
              </div>
            )}

            {listTotal > 0 && (
              <div className="py-2 text-center text-xs text-neutral-500">
                Affichage {listItems.length}/{listTotal}
              </div>
            )}
          </div>
        </section>
      ) : (
      /* —— MODE GRILLE quand pas de recherche —— */
      <>
        {enableAgg && aggError && (
          <div className="rounded border p-3 text-sm
                          border-yellow-300 bg-yellow-50 text-yellow-800
                          dark:border-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
            L’exploration (tendances/mots-clés) n’est pas encore dispo côté serveur.
          </div>
        )}

        {/* Grille d’images (Instagram-like) */}
        <section className="space-y-3">
          <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">Signalements publics récents</h2>

          {gridError && (
            <div className="rounded border p-3 text-sm
                            border-yellow-300 bg-yellow-50 text-yellow-800
                            dark:border-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
              Les signalements ne sont pas encore disponibles. Réessaie plus tard.
            </div>
          )}

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5 sm:gap-2">
            {gridLoading && !gridItems.length
              ? Array.from({ length: 12 }).map((_, i) => (
                  <div key={`skeleton-tile-${i}`} className={`${aspectClass} bg-neutral-200 dark:bg-neutral-800`} />
                ))
              : gridItems.map((r) => {
                  const img = pickImage(r);
                  return (
                    <Link
                      key={`report-${r.id}`}
                      to={`/reports/${r.id}`}
                      className={`relative block ${aspectClass} overflow-hidden bg-neutral-100 dark:bg-neutral-900`}
                      title={r.type || r.entityName || r.entity || "Report"}
                    >
                      {img ? (
                        <img
                          src={img}
                          alt={r.type || r.entityName || r.entity || "Report"}
                          className="block h-full w-full"
                          style={{ objectFit: TILE_FIT, borderRadius: 0 }}
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="h-full w-full grid place-items-center text-neutral-500">Aperçu</div>
                      )}
                    </Link>
                  );
                })}
          </div>

          <div ref={sentinelRef} className="h-10" />
          {(USE_MANUAL_LOAD || gridHasNext) && (
            <div className="py-2 text-center">
              <button
                type="button"
                disabled={!gridHasNext || gridFetchingNext}
                onClick={()=>gridFetchNext()}
                className="rounded border px-3 py-1 text-sm
                           border-neutral-300 text-neutral-700 hover:bg-neutral-50
                           disabled:opacity-60
                           dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
              >
                {gridFetchingNext ? "Chargement…" : (gridHasNext ? "Voir plus" : "Fin de résultats")}
              </button>
            </div>
          )}
        </section>
      </>
      )}
    </div>
  );
}
