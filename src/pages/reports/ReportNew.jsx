// src/pages/reports/ReportNew.jsx
import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useNavigate, Link, useLocation } from "react-router-dom";

/** Debounce tout simple */
function useDebouncedValue(value, delay = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

const SCENARIOS = [
  { key: "phone",   label: "Numéro de téléphone" },
  { key: "person",  label: "Personne" },
  { key: "vehicle", label: "Véhicule" },
  { key: "company", label: "Entreprise / Marque" },
];

const SCAM_TYPES = [
  "Faux support bancaire",
  "Investissement crypto",
  "Faux recrutement",
  "Usurpation d'identité",
  "Colis / livraison",
  "Résidence / location",
  "Autre",
];

const MAX_FILES  = 6;
const MAX_TITLE  = 120;
const MIN_STORY  = 20;

export default function ReportNew() {
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();

  const prefill   = location.state?.prefill   || null;
  const forceStep = location.state?.forceStep || null;

  // ——— Profil
  const { data: me, isLoading: meLoading, isError: meError, error: meErr } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get("/me")).data,
    retry: 0,
  });

  const isVerified = !!(
    me?.is_verified ||
    (me?.kyc_status && ["verified", "approved"].includes(String(me.kyc_status).toLowerCase())) ||
    me?.verified
  );

  useEffect(() => {
    qc.invalidateQueries({ queryKey: ["me"] });
  }, [qc]);

  // ——— Wizard
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (isVerified && (forceStep === 3 || prefill?.caseId)) setStep(3);
    else if (isVerified && step === 0) setStep(1);
  }, [isVerified, step, forceStep, prefill?.caseId]);

  // ——— Step 2: pré-check
  const [preQ, setPreQ] = useState("");
  const preQd = useDebouncedValue(preQ, 400);
  const minLen = 1;
  const { data: precheck, isLoading: preLoading } = useQuery({
    queryKey: ["precheck", preQd],
    queryFn: async () => {
      const q = (preQd || "").trim();
      if (q.length < minLen) return { items: [] };
      const res = await api.get("/cases/precheck", { params: { q } });
      return res.data || { items: [] };
    },
    enabled: step === 2 && (preQd?.trim()?.length || 0) >= minLen,
    retry: 0,
    staleTime: 10_000,
  });

  // ——— Step 3: infos
  const [title, setTitle]       = useState(prefill?.title || "");
  const [scenario, setScenario] = useState(prefill?.scenario || "phone");
  const [phone, setPhone]       = useState(prefill?.identifiers?.phone || "");
  const [fullName, setFullName] = useState(prefill?.identifiers?.fullName || "");
  const [brand, setBrand]       = useState(prefill?.identifiers?.brand || "");
  const [website, setWebsite]   = useState(prefill?.identifiers?.website || "");
  const [scamType, setScamType] = useState(prefill?.category || SCAM_TYPES[0]);
  const [plate, setPlate]       = useState("");
  const [socials, setSocials]   = useState("");
  const [city, setCity]         = useState("");
  const [date, setDate]         = useState("");

  // ——— Step 4: preuves (preview local seulement)
  const [files, setFiles] = useState([]); // [{file, name, size, mime, localUrl}]
  const handlePickFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;
    const remaining = Math.max(0, MAX_FILES - files.length);
    const slice = picked.slice(0, remaining);
    const withLocal = slice.map((file) => ({
      file,
      name: file.name,
      size: file.size,
      mime: file.type,
      localUrl: URL.createObjectURL(file),
    }));
    setFiles((prev) => [...prev, ...withLocal]);
    e.target.value = "";
  };
  const removeFile = (localUrl) => {
    setFiles((prev) => prev.filter((f) => f.localUrl !== localUrl));
    URL.revokeObjectURL(localUrl);
  };

  // ——— Step 5: récit + engagements
  const [story, setStory]             = useState("");
  const [agreedRules, setAgreedRules] = useState(false);
  const [confirmTruth, setConfirmTruth] = useState(false);

  const canNextFromStep1 = !!scenario;
  const canNextFromStep2 = true;
  const canNextFromStep3 = title.trim().length > 5 && title.trim().length <= MAX_TITLE;
  const canNextFromStep4 = files.length <= MAX_FILES;
  const canNextFromStep5 = story.trim().length >= MIN_STORY;
  const canPublish       = canNextFromStep5 && agreedRules && confirmTruth;

  // ——— Publication: crée (case si besoin) → crée report (in_review) → upload evidence (par report) → testimony (case)
  const publishMutation = useMutation({
    mutationFn: async () => {
      // helper type du report
      const type =
        scenario === "person" ? "Personne" :
        scenario === "phone"  ? "Téléphone" :
        scenario === "company"? "Entreprise" :
        scenario === "vehicle"? "Véhicule" :
        "Autre";

      // (A) Ajout à un dossier existant
      if (prefill?.caseId) {
        const caseId = prefill.caseId;

        // (1) Créer le report (status in_review pour la modération)
        const createdReport = await api.post('/reports', {
          case_id: caseId,
          title: title.trim(),
          description: (story || '').trim(),   // ✅ récit complet
          type: scenario === 'person' ? 'Personne'
              : scenario === 'phone' ? 'Téléphone'
              : scenario === 'company' ? 'Entreprise'
              : 'Autre',
          category: scamType,
          is_public: true,
          status: 'in_review',
        });
        const reportId = createdReport?.data?.id || createdReport?.data?.report?.id;
        if (!reportId) throw new Error("Report créé mais id manquant");

        // (2) Upload des médias PAR REPORT
        for (const f of files) {
          const form = new FormData();
          form.append("file", f.file);
          const mime = (f.mime || f.file?.type || "").toLowerCase();
          const evType = mime.startsWith("image/") ? "image" : mime.startsWith("video/") ? "video" : "doc";
          form.append("type", evType);
          await api.post(`/reports/${reportId}/evidence`, form, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
        // (3) Notif (optionnelle – silencieuse) : à retirer si inutile en prod
        try {
          await api.post("/debug/make-notif", {
            user_id: me?.id,
            kind: "signalement envoyé",
            data: { reportId, caseId, title, status: "in_review" },
          });
        } catch {}

        return { reportId };
      }

      // (B) Nouveau dossier
      // 1) Préparer l’entité à partir du scénario
      const kind =
        scenario === "phone"  ? "phone"  :
        scenario === "person" ? "person" :
        scenario === "vehicle"? "company" : // on mappe “vehicle” sur entity kind “company” (à adapter si tu as un modèle “vehicle”)
        "company";

      const entityName =
        kind === "phone"
          ? (phone || fullName || brand || plate || website || "Inconnu")
          : (brand || fullName || phone || plate || website || "Inconnu");

      // 2) Créer le case
      const createdCase = await api.post("/cases", {
        entity: {
          name: entityName,
          kind,
          phone: kind === "phone" ? (phone || null) : null,
          url: website || null,
        },
        category: scamType || "Autre",
        summary: title.trim() || null,
        risk_level: "medium",
      });
      const caseId = createdCase?.data?.case?.id || createdCase?.data?.id;
      if (!caseId) throw new Error("Création du dossier impossible (id manquant).");

      // 3) Créer le report (in_review)
      const createdReport = await api.post('/reports', {
          case_id: caseId,
          title: title.trim(),
          description: (story || '').trim(),   // ✅ récit complet
          type: scenario === 'person' ? 'Personne'
              : scenario === 'phone' ? 'Téléphone'
              : scenario === 'company' ? 'Entreprise'
              : 'Autre',
          category: scamType,
          is_public: true,
          status: 'in_review',
        });
      const reportId = createdReport?.data?.id || createdReport?.data?.report?.id;
      if (!reportId) throw new Error("Report créé mais id manquant");

      // 4) Upload des médias PAR REPORT
      for (const f of files) {
        const form = new FormData();
        form.append("file", f.file);
        const mime = (f.mime || f.file?.type || "").toLowerCase();
        const evType = mime.startsWith("image/") ? "image" : mime.startsWith("video/") ? "video" : "doc";
        form.append("type", evType);
        await api.post(`/reports/${reportId}/evidence`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      // 5) Notif (optionnelle – silencieuse)
      try {
        await api.post("/debug/make-notif", {
          user_id: me?.id,
          kind: "signalement envoyé",
          data: { reportId, caseId, title, status: "in_review" },
        });
      } catch {}

      return { reportId };
    },

    onSuccess: ({ reportId }) => {
      alert("Votre signalement a été envoyé et va passer en examen.");
      // rafraîchir le feed et le profil si tu veux
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["me"] });
      navigate(`/reports/${reportId}`);
    },

    onError: (err) => {
      const status = err?.response?.status;
      const data   = err?.response?.data;
      console.error("Publish failed", status, data, err?.message);
      alert(`Échec de la publication${status ? ` (HTTP ${status})` : ""}. Regarde la console / logs serveur.`);
    },
  });

  // ——— UI helpers
  const Step = ({ n, title, children }) => (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <div
          className={`h-6 w-6 shrink-0 rounded-full text-xs grid place-items-center border ${
            step === n
              ? "bg-white text-black"
              : "bg-neutral-900 text-neutral-300 border-neutral-700"
          }`}
        >
          {n}
        </div>
        <h2 className="text-lg font-medium">{title}</h2>
      </div>
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
        {children}
      </div>
    </section>
  );

  const NextPrev = ({ canNext, onNext }) => (
    <div className="mt-3 flex items-center justify-between">
      <button
        type="button"
        onClick={() => setStep((s) => Math.max(0, s - 1))}
        className="rounded border border-neutral-700 px-3 py-1 text-sm hover:bg-neutral-900"
        disabled={step === 0}
      >
        Retour
      </button>
      <button
        type="button"
        onClick={onNext}
        className="rounded bg-white px-3 py-1 text-sm font-medium text-black hover:opacity-90 disabled:opacity-60"
        disabled={!canNext}
      >
        Suivant
      </button>
    </div>
  );

  // ——— Render
  if (meLoading) return <div className="p-4 text-sm text-neutral-400">Chargement…</div>;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-3">
      <h3 className="text-2xl font-semibold">Nouveau signalement</h3>

      {meError && (
        <div className="rounded border border-yellow-800 bg-yellow-900/30 p-3 text-sm text-yellow-100">
          Impossible de récupérer votre profil (/me)
          {meErr?.response?.status ? ` (${meErr.response.status})` : ""}.
        </div>
      )}

      {/* Step 0 — Gate */}
      {step === 0 && (
        <Step n={0} title="Compte vérifié requis">
          {isVerified ? (
            <div className="text-sm text-neutral-300">Votre compte est vérifié. Continuer.</div>
          ) : (
            <div className="space-y-3 text-sm">
              <p>
                Seuls les comptes <strong>vérifiés (ID + téléphone)</strong> peuvent publier des
                signalements.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate("/kyc", { state: { from: "/reports/new" } })}
                  className="rounded bg-white px-3 py-1 text-sm font-medium text-black hover:opacity-90"
                >
                  Vérifier mon compte
                </button>
                <button
                  type="button"
                  className="rounded border border-neutral-700 px-3 py-1 text-sm hover:bg-neutral-900"
                  disabled
                >
                  Continuer
                </button>
              </div>
            </div>
          )}
          {isVerified && (
            <div className="mt-4">
              <NextPrev canNext={true} onNext={() => setStep(1)} />
            </div>
          )}
        </Step>
      )}

      {/* Step 1 — Scénario */}
      {step === 1 && (
        <Step n={1} title="Que souhaitez-vous signaler ?">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SCENARIOS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setScenario(s.key)}
                className={`rounded-xl border px-3 py-3 text-sm hover:bg-neutral-900 ${
                  scenario === s.key ? "border-white" : "border-neutral-700"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <NextPrev canNext={!!scenario} onNext={() => setStep(2)} />
        </Step>
      )}

      {/* Step 2 — Pré-check doublons */}
      {step === 2 && (
        <Step n={2} title="Rechercher des dossiers existants">
          <p className="text-sm text-neutral-300 mb-2">
            Avant de créer un nouveau dossier, vérifiez s’il n’existe pas déjà (y compris variantes
            d’orthographe).
          </p>
          <input
            value={preQ}
            onChange={(e) => setPreQ(e.target.value)}
            placeholder="Nom, numéro, plaque, site, @compte…"
            className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
          />
          {preQ.trim().length < minLen && (
            <div className="p-3 text-xs text-neutral-500">Tape au moins {minLen} caractère…</div>
          )}
          {preLoading && preQ.trim().length >= minLen && (
            <div className="p-3 text-sm text-neutral-400">Recherche…</div>
          )}
          {!preLoading && preQ.trim().length >= minLen && (
            precheck?.items?.length ? precheck.items.map((it) => {
              const href = it.reportId
                ? `/reports/${it.reportId}`
                : `/discover?q=${encodeURIComponent(it.entityName || it.title || preQ)}`;
              return (
                <Link key={it.id} to={href} className="block p-3 hover:bg-neutral-900/60">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{it.title || it.entityName || "Dossier"}</span>
                    <span className="text-xs text-neutral-400">
                      {it.createdAt ? new Date(it.createdAt).toLocaleDateString() : ""}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-400">{it.type}</div>
                </Link>
              );
            }) : (
              <div className="p-3 text-sm text-neutral-500">Aucun dossier trouvé.</div>
            )
          )}
          <NextPrev canNext={true} onNext={() => setStep(3)} />
        </Step>
      )}

      {/* Step 3 — Dossier : informations principales */}
      {step === 3 && (
        <Step n={3} title="Dossier : informations principales">
          <div className="grid gap-3">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Titre du dossier</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={MAX_TITLE}
                placeholder="Nom d’entreprise, numéro de téléphone, plaque…"
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
              />
              <div className="mt-1 text-[10px] text-neutral-500">
                {title.trim().length}/{MAX_TITLE}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Type d’arnaque</label>
                <select
                  value={scamType}
                  onChange={(e) => setScamType(e.target.value)}
                  className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
                >
                  {SCAM_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Ville / Lieu</label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Abidjan…"
                  className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
                />
              </div>
            </div>

            {scenario === "phone" && (
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Numéro de téléphone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+225 01 23 45 67"
                  className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
                />
              </div>
            )}
            {scenario === "person" && (
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Nom complet</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="K. D. N'Guessan"
                  className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
                />
              </div>
            )}
            {scenario === "vehicle" && (
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Plaque d’immatriculation</label>
                <input
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  placeholder="1234-HJ-01"
                  className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
                />
              </div>
            )}
            {scenario === "company" && (
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Entreprise / Marque</label>
                <input
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Orange CI"
                  className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Site web</label>
                <input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://…"
                  className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Réseaux sociaux</label>
                <input
                  value={socials}
                  onChange={(e) => setSocials(e.target.value)}
                  placeholder="@pseudo, lien Insta/TikTok…"
                  className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
          <NextPrev canNext={canNextFromStep3} onNext={() => setStep(4)} />
        </Step>
      )}

      {/* Step 4 — Preuves */}
      {step === 4 && (
        <Step n={4} title="Preuves (jusqu’à 6)">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <input
                id="evidence"
                type="file"
                accept="image/*,video/*,audio/*,.pdf"
                multiple
                onChange={handlePickFiles}
                className="hidden"
              />
              <label
                htmlFor="evidence"
                className="cursor-pointer rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm hover:bg-neutral-800"
              >
                + Ajouter des médias
              </label>
              <span className="text-xs text-neutral-500">
                {files.length}/{MAX_FILES}
              </span>
            </div>

            {files.length > 0 && (
              <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {files.map((f) => (
                  <li
                    key={f.localUrl}
                    className="relative rounded-md overflow-hidden border border-neutral-800"
                  >
                    {f.mime?.startsWith("image/") ? (
                      <img src={f.localUrl} alt={f.name} className="h-28 w-full object-cover" />
                    ) : f.mime?.startsWith("video/") ? (
                      <video src={f.localUrl} className="h-28 w-full object-cover" />
                    ) : (
                      <div className="h-28 grid place-items-center text-xs text-neutral-400 p-2 break-words">
                        {f.name || f.mime}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(f.localUrl)}
                      className="absolute right-1 top-1 rounded bg-black/60 px-1 text-xs"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <NextPrev canNext={canNextFromStep4} onNext={() => setStep(5)} />
        </Step>
      )}

      {/* Step 5 — Récit */}
      {step === 5 && (
        <Step n={5} title="Récit structuré">
          <div className="space-y-3">
            <div className="text-sm text-neutral-300">
              Réponds brièvement : <em>Que s’est-il passé ?</em>{" "}
              <em>Quel préjudice (montant / perte) ?</em>{" "}
              <em>As-tu contacté la police ?</em>
            </div>
            <textarea
              rows={6}
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder={`Min. ${MIN_STORY} caractères. Donne des faits utiles (dates, montants, échanges, etc.).`}
              className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
            />
            <div className="text-[10px] text-neutral-500">
              {story.trim().length} caractères
            </div>
          </div>
          <NextPrev canNext={canNextFromStep5} onNext={() => setStep(6)} />
        </Step>
      )}

      {/* Step 6 — Aperçu & publication */}
      {step === 6 && (
        <Step n={6} title="Aperçu & engagement">
          <div className="space-y-3 text-sm">
            <div className="rounded border border-neutral-800 p-3">
              <div className="font-medium">{title}</div>
              <div className="text-xs text-neutral-400">
                {scamType} • {city || "Lieu inconnu"} • {date || "Date inconnue"}
              </div>
              <div className="mt-2 whitespace-pre-wrap">{story}</div>
              {files.length > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-1">
                  {files.map((f) => (
                    <img key={f.localUrl} src={f.localUrl} alt="evidence" className="h-24 w-full object-cover rounded" />
                  ))}
                </div>
              )}
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="accent-white"
                checked={agreedRules}
                onChange={(e) => setAgreedRules(e.target.checked)}
              />
              J’accepte les règles : faux signalement = bannissement.
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="accent-white"
                checked={confirmTruth}
                onChange={(e) => setConfirmTruth(e.target.checked)}
              />
              Je certifie l’exactitude de mon témoignage.
            </label>

            {publishMutation.isError && (
              <div className="text-xs text-red-300">
                Échec de la publication. Vérifie la console / logs serveur.
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(5)}
                className="rounded border border-neutral-700 px-3 py-1 text-sm hover:bg-neutral-900"
              >
                Retour
              </button>

              <button
                type="button"
                onClick={() => publishMutation.mutate()}
                disabled={!canPublish || publishMutation.isPending}
                className="rounded bg-white px-3 py-1 text-sm font-medium text-black hover:opacity-90 disabled:opacity-60"
              >
                {publishMutation.isPending ? "Publication…" : "Publier"}
              </button>
            </div>
          </div>
        </Step>
      )}
    </div>
  );
}
