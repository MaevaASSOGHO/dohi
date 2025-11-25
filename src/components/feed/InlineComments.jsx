import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api, { commentReportViaApi } from "../../lib/api";
import { useState } from "react";

const KIND_LABELS = {
  preuve: "Preuve/justificatif",
  contact: "Coordonnées suspect",
  montant: "Montant/transaction",
  temoignage: "Témoignage",
  conseil: "Conseil prévention",
};

function timeAgo(iso) {
  const d = new Date(iso),
    s = Math.floor((Date.now() - d) / 1e3);
  if (s < 60) return `il y a ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const j = Math.floor(h / 24);
  if (j < 30) return `il y a ${j} j`;
  const mo = Math.floor(j / 30);
  if (mo < 12) return `il y a ${mo} mois`;
  const y = Math.floor(mo / 12);
  return `il y a ${y} an${y > 1 ? "s" : ""}`;
}

export default function InlineComments({ reportId, onClose }) {
  const qc = useQueryClient();
  const [kind, setKind] = useState("preuve");
  const [message, setMessage] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["report-comments", reportId],
    queryFn: async () =>
      (await api.get(`/reports/${reportId}/comments`)).data,
    enabled: !!reportId,
  });

  const mutation = useMutation({
    mutationFn: async ({ kind, message }) =>
      (await commentReportViaApi(reportId, { kind, message })).data,
    onSuccess: () => {
      setMessage("");
      qc.invalidateQueries({ queryKey: ["report-comments", reportId] });
    },
  });

  const comments = data?.items ?? [];
  const canSubmit =
    message.trim().length >= 5 && message.trim().length <= 2000;

  return (
    <div className="mt-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-950/60">
      {/* formulaire compact */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) mutation.mutate({ kind, message });
        }}
        className="flex flex-col gap-2 p-3"
      >
        {/* Disposition mobile : première ligne avec select et boutons */}
        <div className="flex gap-2 items-center">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className="flex-1 rounded border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-black/60 px-2 py-1 text-xs text-neutral-900 dark:text-neutral-100"
          >
            {Object.entries(KIND_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={!canSubmit || mutation.isPending}
            className="rounded bg-neutral-900 dark:bg-white p-2 text-white dark:text-black hover:opacity-90 disabled:opacity-60"
            title="Envoyer le commentaire"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded border border-neutral-200 dark:border-neutral-800 p-2 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-900"
            title="Fermer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Deuxième ligne : textarea */}
        <textarea
          rows={2}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`Min. 5 caractères...`}
          className="w-full rounded border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-black/60 px-2 py-1 text-sm text-neutral-900 dark:text-neutral-100"
        />

        {mutation.isError && (
          <div className="text-xs text-red-300">Échec de l'envoi.</div>
        )}
      </form>

      {/* liste compacte */}
      <div className="max-h-64 overflow-auto divide-y divide-neutral-900">
        {isLoading && (
          <div className="p-3 text-sm text-neutral-400">Chargement…</div>
        )}
        {isError && (
          <div className="p-3 text-sm text-red-300">
            Impossible de charger les commentaires.{" "}
            <button onClick={() => refetch()} className="underline">
              Réessayer
            </button>
          </div>
        )}
        {!isLoading && comments.length === 0 && (
          <div className="p-3 text-sm text-neutral-400">
            Aucun commentaire pour l'instant.
          </div>
        )}
        {comments.map((c) => (
          <div key={c.id} className="p-3 text-sm">
            <div className="mb-1 flex items-center gap-2 text-xs text-neutral-400">
              <span className="rounded-full border border-neutral-700 bg-neutral-900 px-2 py-0.5">
                {KIND_LABELS[c.kind] || c.kind}
              </span>
              <span>•</span>
              <span>{timeAgo(c.createdAt)}</span>
              {(c.authorLabel || c.authorName) && (
                <>
                  <span>•</span>
                  <span className="text-neutral-300">
                    {c.authorLabel || c.authorName}
                  </span>
                </>
              )}
            </div>
            <div className="whitespace-pre-wrap text-neutral-100">
              {c.message}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}