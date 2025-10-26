import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";

function timeAgo(iso) {
  const d = new Date(iso); const s = Math.floor((Date.now()-d.getTime())/1000);
  if (s<60) return `il y a ${s}s`; const m=Math.floor(s/60);
  if (m<60) return `il y a ${m} min`; const h=Math.floor(m/60);
  if (h<24) return `il y a ${h} h`; const j=Math.floor(h/24);
  if (j<30) return `il y a ${j} j`; const mo=Math.floor(j/30);
  if (mo<12) return `il y a ${mo} mois`; const y=Math.floor(mo/12);
  return `il y a ${y} an${y>1?"s":""}`;
}

const KIND_LABELS = {
  preuve: "Preuve/justificatif",
  contact: "Coordonnées suspect",
  montant: "Montant/transaction",
  temoignage: "Témoignage",
  conseil: "Conseil prévention",
};

export default function GuidedComments({ reportId, autoFocus = false }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(autoFocus);
  const [kind, setKind] = useState("preuve");
  const [message, setMessage] = useState("");
  const anchorRef = useRef(null);

  useEffect(() => {
    if (autoFocus) {
      setOpen(true);
      setTimeout(() => anchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  }, [autoFocus]);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["report-comments", reportId],
    queryFn: async () => (await api.get(`/reports/${reportId}/comments`)).data,
    enabled: !!reportId,
  });

  const comments = data?.items ?? [];
  const total = data?.total ?? comments.length;

  const mutation = useMutation({
    mutationFn: async ({ kind, message }) =>
      (await api.post(`/reports/${reportId}/comments`, { kind, message })).data,
    onSuccess: () => {
      setMessage("");
      qc.invalidateQueries({ queryKey: ["report-comments", reportId] });
    },
  });

  const canSubmit = message.trim().length >= 5 && message.trim().length <= 2000;

  return (
    <section ref={anchorRef} className="space-y-3">
      <header className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">Commentaires</h2>
        <span className="rounded-full border border-neutral-800 px-2 py-0.5 text-xs text-neutral-300">
          {total}
        </span>
        <button
          onClick={() => setOpen((v) => !v)}
          className="ml-auto rounded border border-neutral-700 px-3 py-1 text-sm hover:bg-neutral-900"
        >
          {open ? "Masquer" : "Ajouter un commentaire"}
        </button>
      </header>

      {/* Formulaire guidé */}
      {open && (
        <form
          onSubmit={(e) => { e.preventDefault(); if (canSubmit) mutation.mutate({ kind, message }); }}
          className="rounded-xl border border-neutral-800 p-3 space-y-2 bg-neutral-950/50"
        >
          <div className="grid gap-2 sm:grid-cols-3">
            <label className="text-sm">
              <span className="mb-1 block">Type</span>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
              >
                {Object.entries(KIND_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </select>
            </label>
            <div className="sm:col-span-2 text-xs text-neutral-400 self-end">
              Évite les données personnelles non nécessaires.
            </div>
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Décris ton information (liens, éléments concrets…)."
            className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
          />
          <div className="flex items-center gap-3">
            <button
              disabled={!canSubmit || mutation.isPending}
              className="rounded bg-white px-4 py-2 text-sm font-medium text-black hover:opacity-90 disabled:opacity-60"
            >
              {mutation.isPending ? "Envoi…" : "Publier"}
            </button>
            {mutation.isError && (
              <span className="text-sm text-red-300">Échec de l’envoi, réessaie.</span>
            )}
            <span className="ml-auto text-xs text-neutral-500">
              {message.length}/2000
            </span>
          </div>
        </form>
      )}

      {/* Liste des commentaires */}
      <div className="space-y-2">
        {isLoading && <div className="text-sm text-neutral-400">Chargement…</div>}
        {isError && (
          <div className="text-sm text-red-300">
            Impossible de charger les commentaires{error?.response?.status ? ` (${error.response.status})` : ""}.
            <button onClick={() => refetch()} className="ml-2 underline">Réessayer</button>
          </div>
        )}
        {(!isLoading && comments.length === 0) ? (
          <div className="text-sm text-neutral-400">Aucun commentaire pour l’instant.</div>
        ) : null}

        {comments.map((c) => (
          <article key={c.id} className="rounded-xl border border-neutral-800 p-3">
            <div className="mb-1 flex items-center gap-2 text-xs">
              <span className="rounded-full border border-neutral-700 bg-neutral-900 px-2 py-0.5">
                {KIND_LABELS[c.kind] || c.kind}
              </span>
              <span className="text-neutral-400">•</span>
              <span className="text-neutral-400">{timeAgo(c.createdAt)}</span>
              {c.authorName && (
                <>
                  <span className="text-neutral-400">•</span>
                  <span className="text-neutral-300">{c.authorName}</span>
                </>
              )}
            </div>
            <div className="whitespace-pre-wrap text-sm text-neutral-100">
              {c.message}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
