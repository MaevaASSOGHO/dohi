// src/pages/kyc/KycWizard.jsx
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../../../lib/api";

export default function KycWizard() {
  const [status, setStatus] = useState("loading");
  const [busy, setBusy]     = useState(false);
  const [err, setErr]       = useState("");
  const [submission, setSubmission] = useState(null); // ← fichiers en base

  // fichiers sélectionnés (pré-POST)
  const [front, setFront]   = useState(null);
  const [back,  setBack]    = useState(null);
  const [selfie, setSelfie] = useState(null);

  const frontUrl  = useObjectUrl(front);
  const backUrl   = useObjectUrl(back);
  const selfieUrl = useObjectUrl(selfie);

  const qc = useQueryClient();

  // charge statut + dernière submission
  useEffect(() => {
    api.get("/kyc")
      .then(res => {
        setStatus(res.data?.status || "unverified");
        setSubmission(res.data?.submission || null);
        const s = String(res.data?.status || "").toLowerCase();
        if (["verified","approved"].includes(s)) {
          qc.invalidateQueries({ queryKey: ["me"] });
        }
      })
      .catch(() => setStatus("loading_error"));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!front || !back || !selfie) {
      setErr("Merci de joindre les trois photos (recto, verso, selfie).");
      return;
    }
    const form = new FormData();
    form.append("id_front", front);
    form.append("id_back",  back);
    form.append("selfie",   selfie);

    setBusy(true);
    try {
      const { data } = await api.post("/kyc", form); // Axios gère le boundary
      setStatus(data?.status || "pending");
      // recharge la submission pour avoir les chemins stockés
      const { data: s } = await api.get("/kyc");
      setSubmission(s?.submission || null);
      alert("Dossier envoyé. Vérification en cours.");
      // ⭐ Le statut utilisateur pourra évoluer, synchronise /me
      qc.invalidateQueries({ queryKey: ["me"] });
      // reset des sélections locales
      setFront(null); setBack(null); setSelfie(null);
    } catch (e) {
      console.error("KYC error:", e?.response?.data);
      const msg =
        e?.response?.data?.errors
          ? Object.values(e.response.data.errors).flat()[0]
          : (e?.response?.data?.message || "Envoi impossible. Réessaie.");
      setErr(msg);
    } finally {
      setBusy(false);
    }
  };

  const cancelPending = async () => {
    if (!confirm("Annuler la soumission en attente ?")) return;
    setBusy(true);
    try {
      await api.delete("/kyc");
      setStatus("unverified");
      setSubmission(null);
    } finally {
      setBusy(false);
    }
  };

  // URLs signées (3 minutes)
  const signedFront  = useSignedUrl(submission?.files?.id_front, 180);
  const signedBack   = useSignedUrl(submission?.files?.id_back,  180);
  const signedSelfie = useSignedUrl(submission?.files?.selfie,   180);

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3">
        <StatusBadge status={status} />
        {status === "pending" && (
          <button
            onClick={cancelPending}
            disabled={busy}
            className="text-xs rounded border px-2 py-1
                       border-neutral-300 text-neutral-700 hover:bg-neutral-50
                       disabled:opacity-60
                       dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
          >
            Annuler la soumission
          </button>
        )}
      </div>

      {/* FORMULAIRE (avant validation) */}
      {status !== "approved" && (
        <form onSubmit={submit} className="grid gap-4">
          {err && (
            <div className="rounded border p-3 text-sm
                            border-red-300 bg-red-50 text-red-800
                            dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
              {err}
            </div>
          )}

          <Field label="Pièce d’identité — recto">
            <FileDrop name="id_front" file={front} setFile={setFront} previewUrl={frontUrl} />
          </Field>

          <Field label="Pièce d’identité — verso">
            <FileDrop name="id_back" file={back} setFile={setBack} previewUrl={backUrl} />
          </Field>

          <Field label="Selfie (tenir la pièce)">
            <FileDrop name="selfie" file={selfie} setFile={setSelfie} previewUrl={selfieUrl} />
          </Field>

          <button
            disabled={busy || status==='pending'}
            className="rounded bg-white px-4 py-2 text-sm font-medium text-black hover:opacity-90 disabled:opacity-60
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
          >
            {busy ? "Envoi…" : "Envoyer le dossier"}
          </button>
        </form>
      )}

      {/* APERÇU DE LA DERNIÈRE SOUMISSION (après envoi) */}
      {submission?.files && (
        <div className="mt-2 grid gap-3">
          <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Derniers fichiers envoyés</h4>
          <div className="flex flex-wrap gap-3">
            <ThumbBox label="Recto" url={signedFront} fallbackName={submission.files.id_front} />
            <ThumbBox label="Verso" url={signedBack}  fallbackName={submission.files.id_back} />
            <ThumbBox label="Selfie" url={signedSelfie} fallbackName={submission.files.selfie} />
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-500">
            Pour votre sécurité, ces liens expirent automatiquement (≈3 min) et se renouvellent si la page reste ouverte.
          </p>
        </div>
      )}

      {status === "approved" && (
        <p className="text-sm text-emerald-800 dark:text-emerald-300">Votre identité est vérifiée ✅.</p>
      )}
    </div>
  );
}

/* ——— sous-composants ——— */

function StatusBadge({ status }) {
  const map = {
    unverified: { txt: "Non vérifié", cls: "text-neutral-700 bg-neutral-100 border-neutral-300 dark:text-neutral-300 dark:bg-neutral-900/50 dark:border-neutral-700" },
    pending:    { txt: "En attente de vérification", cls: "text-yellow-800 bg-yellow-100 border-yellow-300 dark:text-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-800" },
    approved:   { txt: "Vérifié", cls: "text-emerald-800 bg-emerald-100 border-emerald-300 dark:text-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-800" },
    verified:   { txt: "Vérifié", cls: "text-emerald-800 bg-emerald-100 border-emerald-300 dark:text-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-800" }, // compat
    rejected:   { txt: "Refusé", cls: "text-red-800 bg-red-100 border-red-300 dark:text-red-200 dark:bg-red-900/30 dark:border-red-800" },
  };
  const { txt, cls } = map[status] || map.unverified;
  return (
    <span className={`text-xs uppercase tracking-wide rounded-full px-2 py-1 border ${cls}`}>
      {txt}
    </span>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm text-neutral-800 dark:text-neutral-200">{label}</label>
      {children}
      <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">Formats: JPG/PNG/WEBP/HEIC (max 10 Mo).</p>
    </div>
  );
}

function FileDrop({ name, file, setFile, previewUrl }) {
  const ref = useRef(null);
  const onPick = (e) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };
  const onDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };
  return (
    <div
      onDragOver={(e)=>e.preventDefault()}
      onDrop={onDrop}
      className="rounded border border-dashed p-3
                 border-neutral-300 dark:border-neutral-700"
    >
      <div className="flex items-center gap-3">
        <div className="h-16 w-24 overflow-hidden rounded grid place-items-center border
                        border-neutral-300 bg-neutral-100
                        dark:border-neutral-800 dark:bg-neutral-900">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Prévisualisation"
              className="h-full w-full object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <span className="text-[10px] text-neutral-500">Aperçu</span>
          )}
        </div>
        <div className="flex-1">
          <input
            ref={ref}
            name={name}
            type="file"
            accept="image/*"
            onChange={onPick}
            className="hidden"
          />
          <button
            type="button"
            onClick={()=>ref.current?.click()}
            className="rounded border px-3 py-1.5 text-sm
                       border-neutral-300 text-neutral-700 hover:bg-neutral-50
                       dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
          >
            Choisir une image
          </button>
          {file && <span className="ml-2 text-xs text-neutral-600 dark:text-neutral-400">{file.name}</span>}
        </div>
      </div>
    </div>
  );
}

function ThumbBox({ label, url, fallbackName }) {
  return (
    <div className="w-28">
      <div className="h-20 w-28 overflow-hidden rounded grid place-items-center border
                      border-neutral-300 bg-neutral-100
                      dark:border-neutral-800 dark:bg-neutral-900">
        {url ? (
          <img
            src={url}
            alt={label}
            className="h-full w-full object-cover"
            onError={(e)=>{ e.currentTarget.style.display='none'; }}
          />
        ) : (
          <span className="text-[10px] text-neutral-500">Aperçu</span>
        )}
      </div>
      <div className="mt-1 text-[10px] text-neutral-600 dark:text-neutral-400 truncate" title={fallbackName || ''}>
        {label}
      </div>
    </div>
  );
}

/* ——— hooks utilitaires ——— */

// Génère et rafraîchit automatiquement une URL signée pour `path`.
// `ttl` en secondes (ex. 180). On renouvelle ~20s avant expiration.
function useSignedUrl(path, ttl = 180) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let timer;
    let cancelled = false;

    async function fetchUrl() {
      if (!path) { setUrl(null); return; }
      try {
        const { data } = await api.post("/kyc/signed-url", { path, ttl });
        if (!cancelled) {
          setUrl(data?.url || null);
          const next = Math.max(15, (data?.expires_in ?? ttl) - 20);
          timer = setTimeout(fetchUrl, next * 1000);
        }
      } catch (e) {
        console.error("signed-url failed:", e?.response?.status, e?.response?.data);
        if (!cancelled) setUrl(null);
      }
    }

    fetchUrl();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [path, ttl]);

  return url;
}

function useObjectUrl(file) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!file) { setUrl(null); return; }
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return url;
}
