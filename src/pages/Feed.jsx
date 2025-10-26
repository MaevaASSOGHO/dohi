import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import PostCard from "../components/feed/PostCard";
import { useNavigate } from "react-router-dom";

/* Skeleton pour le chargement */
function PostSkeleton() {
  return (
    <div className="w-full rounded-2xl ring-1 ring-neutral-800/80 bg-neutral-950/70 overflow-hidden animate-pulse">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="h-9 w-9 rounded-full bg-neutral-800" />
        <div className="flex-1">
          <div className="h-3 w-40 bg-neutral-800 rounded" />
          <div className="h-3 w-24 bg-neutral-900 rounded mt-2" />
        </div>
      </div>
      <div className="px-4 pb-4">
        <div className="h-24 bg-neutral-900 rounded" />
      </div>
    </div>
  );
}

/* Carte hydratée (inchangée côté logique) */
function PostCardHydrated({ item, onOpen }) {
  const queryClient = useQueryClient();

  const rawId = item?.reportId ?? item?.id ?? item?.report_id ?? null;
  const reportId =
    typeof rawId === "string"
      ? (rawId.startsWith("r-") ? Number(rawId.slice(2)) : Number(rawId)) || null
      : typeof rawId === "number"
      ? rawId
      : null;

  const { data } = useQuery({
    queryKey: ["report", reportId],
    enabled: !!reportId,
    staleTime: 10_000,
    queryFn: async () => (await api.get(`/reports/${reportId}`)).data,
  });

  const merged = useMemo(() => {
    const r = data?.report;
    return r ? { ...item, ...r } : item;
  }, [item, data]);

  const initialVote = reportId ? localStorage.getItem(`vote:${reportId}`) : null;
  const [myVote, setMyVote] = useState(initialVote === "u" ? "u" : initialVote === "n" ? "n" : null);

  const [useful, setUseful] = useState(
    merged?.usefulCount ?? merged?.upvotes_count ?? merged?.upvotes ?? 0
  );
  const [notUseful, setNotUseful] = useState(
    merged?.notUsefulCount ?? merged?.downvotes_count ?? merged?.downvotes ?? 0
  );

  useEffect(() => {
    setUseful(merged?.usefulCount ?? merged?.upvotes_count ?? merged?.upvotes ?? 0);
    setNotUseful(merged?.notUsefulCount ?? merged?.downvotes_count ?? merged?.downvotes ?? 0);
  }, [merged?.usefulCount, merged?.notUsefulCount, merged?.upvotes_count, merged?.downvotes_count]);

  async function voteToggle(wantedUseful) {
    if (!reportId) return;

    if ((myVote === "u" && wantedUseful) || (myVote === "n" && !wantedUseful)) {
      const prevU = useful, prevN = notUseful, prevMy = myVote;
      if (myVote === "u") setUseful((u) => Math.max(0, u - 1));
      if (myVote === "n") setNotUseful((n) => Math.max(0, n - 1));
      setMyVote(null);

      queryClient.setQueryData(["report", reportId], (old) => {
        const r = old?.report;
        if (!r) return old;
        return {
          report: {
            ...r,
            usefulCount: myVote === "u" ? Math.max(0, r.usefulCount - 1) : r.usefulCount,
            notUsefulCount: myVote === "n" ? Math.max(0, r.notUsefulCount - 1) : r.notUsefulCount,
          },
        };
      });

      try {
        await api.delete(`/reports/${reportId}/vote`);
        localStorage.removeItem(`vote:${reportId}`);
      } catch (e) {
        setUseful(prevU);
        setNotUseful(prevN);
        setMyVote(prevMy);
        queryClient.invalidateQueries({ queryKey: ["report", reportId] });
        console.error("Unvote failed", e?.response || e);
      }
      return;
    }

    if (myVote == null) {
      const prevU = useful, prevN = notUseful;
      if (wantedUseful) setUseful((u) => u + 1);
      else setNotUseful((n) => n + 1);
      setMyVote(wantedUseful ? "u" : "n");

      queryClient.setQueryData(["report", reportId], (old) => {
        const r = old?.report;
        if (!r) return old;
        return {
          report: {
            ...r,
            usefulCount: wantedUseful ? r.usefulCount + 1 : r.usefulCount,
            notUsefulCount: wantedUseful ? r.notUsefulCount : r.notUsefulCount + 1,
          },
        };
      });

      try {
        await api.post(`/reports/${reportId}/vote`, { useful: wantedUseful });
        localStorage.setItem(`vote:${reportId}`, wantedUseful ? "u" : "n");
      } catch (e) {
        setUseful(prevU);
        setNotUseful(prevN);
        setMyVote(null);
        queryClient.invalidateQueries({ queryKey: ["report", reportId] });
        console.error("Vote failed", e?.response || e);
      }
      return;
    }
  }

  return (
    <div className="w-full">
      <PostCard
        item={merged}
        onMediaClick={() => {
          if (reportId) onOpen(reportId);
        }}
        countsOverride={{ useful, notUseful }}
        myVote={myVote}
        onVoteUseful={() => voteToggle(true)}
        onVoteNotUseful={() => voteToggle(false)}
      />
    </div>
  );
}

export default function Feed() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login", { replace: true, state: { from: "/feed" } });
  }, [navigate]);

  const PAGE_SIZE = 10;

  const {
    data,
    error,
    isError,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.get("/feed", { params: { page: pageParam, pageSize: PAGE_SIZE } });
      const items = res.data?.items ?? [];
      const page = res.data?.page ?? pageParam;
      const nextPage =
        typeof res.data?.nextPage !== "undefined"
          ? res.data.nextPage
          : items.length === PAGE_SIZE
          ? page + 1
          : undefined;
      return { items, page, nextPage };
    },
    getNextPageParam: (last) => last.nextPage,
    staleTime: 30_000,
    keepPreviousData: true,
  });

  const allItems = useMemo(() => data?.pages?.flatMap((p) => p.items) ?? [], [data]);

  const handleOpenReport = (reportId) => {
    navigate(`/reports/${reportId}`);
  };

  return (
    // === LARGEUR : on ne met PAS de max-w ici, on prend la largeur du <main> parent ===
    <div className="w-full flex flex-col min-h-full">
      {/* Gouttières horizontales, pas de max-w */}
      <div className="w-full flex-1 flex flex-col px-2 sm:px-4 md:px-6">
        {/* Barre sticky (optionnelle) – garde-la pleine largeur */}
        <div className="sticky top-14 z-10 -mx-2 sm:-mx-4 md:-mx-6 mb-2 px-2 sm:px-4 md:px-6 py-2 bg-gradient-to-b from-black/90 to-black/40 supports-[backdrop-filter]:bg-black/40 backdrop-blur">
          {/* Titre/onglets si besoin */}
        </div>

        {isError && (
          <div className="w-full rounded-2xl border border-red-800 bg-red-900/20 p-4 text-sm text-red-200">
            Impossible de charger le fil. {error?.response?.status ? `(${error.response.status})` : ""}
          </div>
        )}

        {isLoading && (
          <div className="w-full space-y-4">
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </div>
        )}

        <div className="w-full flex-1 flex flex-col gap-4">
          {allItems.map((it, idx) => (
            <PostCardHydrated
              key={(it.id ?? it.reportId ?? idx) + "-" + idx}
              item={it}
              onOpen={handleOpenReport}
            />
          ))}
        </div>

        {!isLoading && !isError && allItems.length === 0 && (
          <div className="w-full rounded-2xl ring-1 ring-neutral-800 bg-neutral-950/60 p-6 text-center text-neutral-300">
            Aucun événement pour le moment.
          </div>
        )}

        {hasNextPage && (
          <div className="w-full flex justify-center py-4">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-full font-medium transition-colors"
            >
              {isFetchingNextPage ? "Chargement..." : "Voir plus"}
            </button>
          </div>
        )}

        {!hasNextPage && allItems.length > 0 && (
          <div className="w-full py-6 text-center text-sm text-neutral-500">Fin du fil</div>
        )}
      </div>
    </div>
  );
}
