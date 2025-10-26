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
      {/* Barre de filtres */}
      <form onSubmit={submitSearch} className="flex flex-wrap items-center gap-2">
        <input
          name="q"
          defaultValue={qEffective}
          placeholder={qEffective ? `Recherche : "${qEffective}"` : "Rechercher…"}
          className="min-w-0 flex-1 rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
        />
        <div className="flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setStatus("")}
            className={`rounded px-2 py-1 border ${status==="" ? "bg-white text-black" : "border-neutral-700 hover:bg-neutral-900"}`}
          >Tous</button>
          <button
            type="button"
            onClick={() => setStatus("verified")}
            className={`rounded px-2 py-1 border ${status==="verified" ? "bg-white text-black" : "border-neutral-700 hover:bg-neutral-900"}`}
          >Vérifiés</button>
          <button
            type="button"
            onClick={() => setStatus("in_review")}
            className={`rounded px-2 py-1 border ${status==="in_review" ? "bg-white text-black" : "border-neutral-700 hover:bg-neutral-900"}`}
          >En revue</button>
        </div>
        {/* Affiche le critère si on vient du feed ou si une recherche est saisie */}
        {(qEffective) && (
          <div className="ml-auto text-xs text-neutral-400">
            Recherche : <span className="font-medium text-neutral-200">{qEffective}</span>
            <button
              type="button"
              onClick={() => {
                const n = new URLSearchParams(searchParams);
                n.delete("entity");
                n.delete("q");
                setSearchParams(n, { replace:true });
              }}
              className="ml-2 underline"
            >
              effacer
            </button>
          </div>
        )}
      </form>

      {/* Liste + scroll box */}
      <div ref={listRef} className="max-h-[70vh] overflow-auto space-y-2">
        {isLoading && <div className="rounded-xl border border-neutral-800 p-3 text-sm text-neutral-400">Chargement…</div>}
        {isError && (
          <div className="rounded-xl border border-neutral-800 p-3 text-sm text-red-300">
            Erreur{error?.response?.status?` (${error.response.status})`:""}. <button onClick={()=>refetch()} className="underline">Réessayer</button>
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="rounded-xl border border-neutral-800 p-3 text-sm text-neutral-400">
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
              className="rounded border border-neutral-700 px-3 py-1 text-sm hover:bg-neutral-900 disabled:opacity-60"
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
