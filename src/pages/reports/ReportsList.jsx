// src/pages/reports/ReportsList.jsx
import { useInfiniteQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef } from "react";
import { api } from "../../lib/api";
import ReportListItem from "../../components/report/ReportListItem";

const PAGE_SIZE = 20;

export default function ReportsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Filtres issus de l’URL (pas de copie en state → évite les désync)
  const entity = searchParams.get("entity") || "";
  const q      = searchParams.get("q") || "";
  // Recherche effective : priorise q, sinon reprend entity (clic depuis feed)
  const qEffective = q || entity;
  const status = searchParams.get("status") || ""; // "", "verified", "in_review"

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    // on clé sur la recherche effective
    queryKey: ["reports", { q: qEffective, status }],
    queryFn: async ({ pageParam = 1 }) => {
      // On n'envoie plus 'entity' pour éviter le filtre exact ; tout passe par q
      const res = await api.get("/reports", {
        params: { q: qEffective, status, page: pageParam, pageSize: PAGE_SIZE },
      });
      return { ...res.data, page: pageParam, hasMore: (pageParam * PAGE_SIZE) < (res.data?.total ?? 0) };
    },
    getNextPageParam: (last) => last?.hasMore ? (last.page + 1) : undefined,
    staleTime: 15_000,
    keepPreviousData: true,
  });

  const items = useMemo(
    () => data?.pages?.flatMap(p => p.items || []) ?? [],
    [data]
  );
  const total = data?.pages?.[0]?.total ?? 0;

  // Scroll infini (intersection observer)
  const listRef = useRef(null);
  const sentinelRef = useRef(null);
  useEffect(() => {
    if (!sentinelRef.current) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      });
    }, { root: listRef.current, rootMargin: "120px" });
    io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // UI helpers
  const setStatus = (s) => {
    const next = new URLSearchParams(searchParams);
    if (s) next.set("status", s); else next.delete("status");
    next.delete("page"); // clean
    setSearchParams(next, { replace: true });
  };

  const submitSearch = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const next = new URLSearchParams(searchParams);
    const qv = (form.get("q") || "").toString();
    if (qv) next.set("q", qv); else next.delete("q");
    // On supprime entity pour forcer la recherche texte (titre/entité)
    next.delete("entity");
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="mx-auto w-full max-w-3xl p-2 space-y-3">
      {/* Bouton retour — pas de background, texte noir (light) / blanc (dark), hover bordure violette */}
      <button
  onClick={() => navigate(-1)}
  className="btn-plain text-neutral-900 dark:text-neutral-100 mb-2"
>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
  Retour
</button>


      {/* Barre de filtres */}
      <form onSubmit={submitSearch} className="flex flex-wrap items-center gap-2">
        <input
          name="q"
          defaultValue={qEffective}
          placeholder={qEffective ? `Recherche : "${qEffective}"` : "Rechercher…"}
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
            onClick={() => setStatus("")}
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
            onClick={() => setStatus("verified")}
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
            onClick={() => setStatus("in_review")}
            className={`rounded px-2 py-1 border ${
              status==="in_review"
                ? "bg-white text-black"
                : "border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900"
            } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40`}
          >
            En revue
          </button>
        </div>

        {/* Affiche le critère si on vient du feed ou si une recherche est saisie */}
        {(qEffective) && (
          <div className="ml-auto text-xs text-neutral-600 dark:text-neutral-400">
            Recherche : <span className="font-medium text-neutral-900 dark:text-neutral-200">{qEffective}</span>
            <button
              type="button"
              onClick={() => {
                const n = new URLSearchParams(searchParams);
                n.delete("entity");
                n.delete("q");
                setSearchParams(n, { replace:true });
              }}
              className="ml-2 underline underline-offset-2 hover:opacity-80"
            >
              effacer
            </button>
          </div>
        )}
      </form>

      {/* Liste + scroll box */}
      <div ref={listRef} className="max-h-[70vh] overflow-auto space-y-2">
        {isLoading && (
          <div className="rounded-xl border p-3 text-sm
                          border-neutral-300 text-neutral-600
                          dark:border-neutral-800 dark:text-neutral-400">
            Chargement…
          </div>
        )}

        {isError && (
          <div className="rounded-xl border p-3 text-sm
                          border-red-300 bg-red-50 text-red-800
                          dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-red-300">
            Erreur{error?.response?.status?` (${error.response.status})`:""}.{" "}
            <button onClick={()=>refetch()} className="underline underline-offset-2 hover:opacity-80">Réessayer</button>
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="rounded-xl border p-3 text-sm
                          border-neutral-300 text-neutral-600
                          dark:border-neutral-800 dark:text-neutral-400">
            {entity ? "Aucun signalement pour cette entité." : "Aucun signalement."}
          </div>
        )}

        {items.map((it) => <ReportListItem key={it.id} item={it} />)}

        {/* Sentinel + fallback bouton */}
        <div ref={sentinelRef} />
        {hasNextPage && (
          <div className="py-2 text-center">
            <button
              disabled={isFetchingNextPage}
              onClick={()=>fetchNextPage()}
              className="rounded border px-3 py-1 text-sm
                         border-neutral-300 text-neutral-700 hover:bg-neutral-50
                         disabled:opacity-60
                         dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
            >
              {isFetchingNextPage ? "Chargement…" : "Charger plus"}
            </button>
          </div>
        )}

        {total > 0 && (
          <div className="py-2 text-center text-xs text-neutral-500">
            Affichage {items.length}/{total}
          </div>
        )}
      </div>
    </div>
  );
}
