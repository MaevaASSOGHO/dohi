// src/pages/reports/ReportNew.jsx
import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  api,
  createCaseViaApi,
  createReportViaApi,
  uploadEvidenceViaApi,
} from "../../lib/api";
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

/** Champs contrôlés robustes (préservent le focus pendant la frappe) */
function TextField({
  label,
  value,
  onCommit,
  placeholder = "",
  maxLength,
  type = "text",
  className = "",
  disabled = false,
  as = "input",
  rows = 3,
}) {
  const [local, setLocal] = useState(value ?? "");
  // hydrate uniquement quand la valeur externe change réellement
  useEffect(() => {
    if ((value ?? "") !== local) setLocal(value ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const Base = as === "textarea" ? "textarea" : "input";

  return (
    <div>
      {label && (
        <label className="block text-xs mb-1 text-neutral-600 dark:text-neutral-400">
          {label}
        </label>
      )}
      <Base
        type={as === "textarea" ? undefined : type}
        rows={as === "textarea" ? rows : undefined}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => onCommit?.(local)}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        className={[
          "w-full rounded border px-3 py-2 text-sm",
          "border-neutral-300 dark:border-neutral-700",
          "bg-white text-neutral-900 placeholder:text-neutral-400",
          "dark:bg-neutral-900 dark:text-neutral-100",
          "focus:outline-none focus:ring-2 focus:ring-violet-500/40",
          className,
        ].join(" ")}
      />
      {typeof maxLength === "number" && (
        <div className="mt-1 text-[10px] text-neutral-500 dark:text-neutral-400">
          {(local || "").trim().length}/{maxLength}
        </div>
      )}
    </div>
  );
}

const SCENARIOS = [
  { key: "phone", label: "Numéro de téléphone" },
  { key: "person", label: "Personne" },
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

const MAX_FILES = 6;
const MAX_TITLE = 120;
const MIN_STORY = 20;

export default function ReportNew() {
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();

  const prefill = location.state?.prefill || null;
  const forceStep = location.state?.forceStep || null;

  // ——— Profil
  const {
    data: me,
    isLoading: meLoading,
    isError: meError,
    error: meErr,
  } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get("/me")).data,
    retry: 0,
  });

  const isVerified = !!(
    me?.is_verified ||
    (me?.kyc_status &&
      ["verified", "approved"].includes(
        String(me.kyc_status).toLowerCase()
      )) ||
    me?.verified
  );

  useEffect(() => {
    qc.invalidateQueries({ queryKey: ["me"] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ——— Wizard
  const [step, setStep] = useState(0);
  const [skippedKyc, setSkippedKyc] = useState(false);
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
  const [title, setTitle] = useState(prefill?.title || "");
  const [scenario, setScenario] = useState(prefill?.scenario || "phone");
  const [phone, setPhone] = useState(prefill?.identifiers?.phone || "");
  const [fullName, setFullName] = useState(
    prefill?.identifiers?.fullName || ""
  );
  const [brand, setBrand] = useState(prefill?.identifiers?.brand || "");
  const [website, setWebsite] = useState(prefill?.identifiers?.website || "");
  const [scamType, setScamType] = useState(
    prefill?.category || SCAM_TYPES[0]
  );
  const [plate, setPlate] = useState("");
  const [socials, setSocials] = useState("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");

  // Effet pour mettre à jour automatiquement le titre selon le scénario
  useEffect(() => {
    if (scenario === "phone" && phone) {
      setTitle(phone);
    } else if (scenario === "person" && fullName) {
      setTitle(fullName);
    } else if (scenario === "vehicle" && plate) {
      setTitle(plate);
    } else if (scenario === "company" && brand) {
      setTitle(brand);
    }
  }, [scenario, phone, fullName, plate, brand]);

  // ——— Step 4: preuves (preview local)
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
  const [story, setStory] = useState("");
  const [agreedRules, setAgreedRules] = useState(false);
  const [confirmTruth, setConfirmTruth] = useState(false);

  const canNextFromStep3 =
    title.trim().length > 5 && title.trim().length <= MAX_TITLE;
  const canNextFromStep4 = files.length <= MAX_FILES;
  const canNextFromStep5 = story.trim().length >= MIN_STORY;
  const canPublish = canNextFromStep5 && agreedRules && confirmTruth;

  // ——— Publication
  const publishMutation = useMutation({
    mutationFn: async () => {
      const reportType =
        scenario === "person"
          ? "Personne"
          : scenario === "phone"
          ? "Téléphone"
          : scenario === "company"
          ? "Entreprise"
          : scenario === "vehicle"
          ? "Véhicule"
          : "Autre";

      // (A) Ajout à un dossier existant
      if (prefill?.caseId) {
        const caseId = prefill.caseId;

        // 1) création du report via helper proxy
        const { data: reportData } = await createReportViaApi({
          case_id: caseId,
          title: title.trim(),
          description: (story || "").trim(),
          type: reportType,
          category: scamType,
          is_public: true,
          status: "in_review",
        });

        const reportId =
          reportData?.id || reportData?.report?.id || reportData?.report_id;
        if (!reportId)
          throw new Error("Report créé mais identifiant manquant.");

        // 2) Upload des médias via helper proxy
        for (const f of files) {
          try {
            await uploadEvidenceViaApi(reportId, f);
          } catch (err) {
            console.error("Upload evidence failed (existing case)", err);
            // on n'interrompt pas toute la publication pour un média
          }
        }

        // try {
        //   await api.post("/debug/make-notif", {
        //     user_id: me?.id,
        //     kind: "signalement envoyé",
        //     data: { reportId, caseId, title, status: "in_review" },
        //   });
        // } catch {}

        return { reportId };
      }

      // (B) Nouveau dossier
      const kind =
        scenario === "phone"
          ? "phone"
          : scenario === "person"
          ? "person"
          : scenario === "vehicle"
          ? "company" // à adapter si tu crées un modèle “vehicle”
          : "company";

      const entityName =
        kind === "phone"
          ? phone || fullName || brand || plate || website || "Inconnu"
          : brand || fullName || phone || plate || website || "Inconnu";

      // 1) create case (proxy)
      const { data: caseData } = await createCaseViaApi({
        entity: {
          name: entityName,
          kind,
          phone: kind === "phone" ? phone || null : null,
          url: website || null,
        },
        category: scamType || "Autre",
        summary: title.trim() || null,
        risk_level: "medium",
      });

      const caseId = caseData?.case?.id || caseData?.id;
      if (!caseId)
        throw new Error("Création du dossier impossible (id manquant).");

      // 2) create report (proxy)
      const { data: reportData } = await createReportViaApi({
        case_id: caseId,
        title: title.trim(),
        description: (story || "").trim(),
        type: reportType,
        category: scamType,
        is_public: true,
        status: "in_review",
      });

      const reportId =
        reportData?.id || reportData?.report_id || reportData?.report?.id;
      if (!reportId)
        throw new Error("Report créé mais identifiant manquant.");

      // 3) upload médias (proxy)
      for (const f of files) {
        try {
          await uploadEvidenceViaApi(reportId, f);
        } catch (err) {
          console.error("Upload evidence failed (new case)", err);
          // on log mais on ne bloque pas entièrement le signalement
        }
      }

      // try {
      //   await api.post("/debug/make-notif", {
      //     user_id: me?.id,
      //     kind: "signalement envoyé",
      //     data: { reportId, caseId, title, status: "in_review" },
      //   });
      // } catch {}

      return { reportId };
    },

    onSuccess: ({ reportId }) => {
      alert(
        "Votre signalement a été envoyé et va passer en examen.\nSi certains médias ne sont pas visibles, réessayez de les ajouter."
      );
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["me"] });
      navigate(`/reports/${reportId}`);
    },

    onError: (err) => {
      const status = err?.response?.status;
      const data = err?.response?.data;
      console.error("Publish failed", status, data, err?.message);
      alert(
        `Échec de la publication${
          status ? ` (HTTP ${status})` : ""
        }. Regarde la console / logs serveur.`
      );
    },
  });

  const Step = ({ n, title, children }) => (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <div
          className={`h-6 w-6 shrink-0 rounded-full text-xs grid place-items-center border ${
            step === n
              ? "bg-white text-black"
              : "bg-neutral-100 text-neutral-700 border-neutral-300 dark:bg-neutral-900 dark:text-neutral-300 dark:border-neutral-700"
          }`}
        >
          {n}
        </div>
        <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
          {title}
        </h2>
      </div>
      <div
        className="rounded-2xl border p-4
                      border-neutral-300 bg-white
                      dark:border-neutral-800 dark:bg-neutral-950/60"
      >
        {children}
      </div>
    </section>
  );

  const NextPrev = ({ canNext, onNext }) => (
    <div className="mt-3 flex items-center justify-between">
      <button
        type="button"
        onClick={() => setStep((s) => Math.max(0, s - 1))}
        className="rounded border px-3 py-1 text-sm
                   border-neutral-300 text-neutral-700 hover:bg-neutral-50
                   dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900
                   disabled:opacity-60
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
        disabled={step === 0}
      >
        Retour
      </button>
      <button
        type="button"
        onClick={onNext}
        className="rounded bg-white px-3 py-1 text-sm font-medium text-black hover:opacity-90 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
        disabled={!canNext}
      >
        Suivant
      </button>
    </div>
  );

  if (meLoading)
    return (
      <div className="p-4 text-sm text-neutral-600 dark:text-neutral-400">
        Chargement…
      </div>
    );

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-3">
      <h3 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
        Nouveau signalement
      </h3>

      {meError && (
        <div
          className="rounded border p-3 text-sm
                        border-yellow-300 bg-yellow-50 text-yellow-800
                        dark:border-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200"
        >
          Impossible de récupérer votre profil (/me)
          {meErr?.response?.status ? ` (${meErr.response.status})` : ""}.
        </div>
      )}

      {/* Step 0 — Gate */}
      {step === 0 && (
        <Step n={0} title="Compte vérifié (optionnel pour publier)">
          {isVerified ? (
            <div className="space-y-3 text-sm">
              <p className="text-neutral-700 dark:text-neutral-300">
                Votre compte est <strong>vérifié</strong>. Vous pouvez continuer
                et publier.
              </p>
              <div className="mt-4">
                <NextPrev canNext={true} onNext={() => setStep(1)} />
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div
                className="rounded border p-3
                              border-yellow-300 bg-yellow-50 text-yellow-800
                              dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-100"
              >
                <div className="font-medium mb-1">
                  Publication possible sans vérification
                </div>
                <p>
                  Votre signalement sera <strong>mis en examen</strong> par la
                  modération. Pour{" "}
                  <em>accélérer la validation</em>, nous recommandons de{" "}
                  <strong>vérifier votre identité (KYC)</strong> avant ou après
                  la publication.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    navigate("/kyc", { state: { from: "/reports/new" } })
                  }
                  className="rounded bg-white px-3 py-1 text-sm font-medium text-black hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                >
                  Vérifier mon compte
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSkippedKyc(true);
                    setStep(1);
                  }}
                  className="rounded border px-3 py-1 text-sm
                             border-neutral-300 text-neutral-700 hover:bg-neutral-50
                             dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                >
                  Continuer sans vérifier
                </button>
              </div>

              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Vous pourrez revenir faire la vérification depuis le menu
                (portrait/paramètres) à tout moment.
              </p>
            </div>
          )}
        </Step>
      )}
    
      {/* Step 1 — Pré-check doublons (anciennement étape 2) */}
      {step === 1 && (
        <Step n={1} title="Rechercher des dossiers existants">
          <p className="text-sm mb-2 text-neutral-700 dark:text-neutral-300">
            Avant de créer un nouveau dossier, vérifiez s’il n’existe pas déjà
            (y compris variantes d’orthographe).
          </p>
          <TextField
            value={preQ}
            onCommit={(v) => setPreQ(v)}
            placeholder="Nom, numéro, plaque, site, @compte…"
          />
          {preQ.trim().length < minLen && (
            <div className="p-3 text-xs text-neutral-600 dark:text-neutral-500">
              Tape au moins {minLen} caractère…
            </div>
          )}
          {preLoading && preQ.trim().length >= minLen && (
            <div className="p-3 text-sm text-neutral-600 dark:text-neutral-400">
              Recherche…
            </div>
          )}
          {!preLoading &&
            preQ.trim().length >= minLen &&
            (precheck?.items?.length ? (
              precheck.items.map((it) => {
                const href = it.reportId
                  ? `/reports/${it.reportId}`
                  : `/discover?q=${encodeURIComponent(
                      it.entityName || it.title || preQ
                    )}`;
                return (
                  <Link
                    key={it.id}
                    to={href}
                    className="block p-3 hover:bg-neutral-50 dark:hover:bg-neutral-900/60 rounded-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">
                        {it.title || it.entityName || "Dossier"}
                      </span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {it.createdAt
                          ? new Date(it.createdAt).toLocaleDateString()
                          : ""}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-400">
                      {it.type}
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="p-3 text-sm text-neutral-600 dark:text-neutral-500">
                Aucun dossier trouvé.
              </div>
            ))}
          <NextPrev canNext={true} onNext={() => setStep(2)} />
        </Step>
      )}

      {/* Step 2 — Scénario (anciennement étape 1) */}
      {step === 2 && (
        <Step n={2} title="Que souhaitez-vous signaler ?">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SCENARIOS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setScenario(s.key)}
                className={`rounded-xl border px-3 py-3 text-sm transition-colors ${
                  scenario === s.key
                    ? "border-violet-400 bg-violet-50 text-violet-700 dark:border-white dark:bg-transparent dark:text-neutral-100"
                    : "border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-900 dark:text-neutral-200"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <NextPrev canNext={!!scenario} onNext={() => setStep(3)} />
        </Step>
      )}

      {/* Step 3 — Dossier : informations principales */}
      {step === 3 && (
        <Step n={3} title="Dossier : informations principales">
          <div className="grid gap-3">
            

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs mb-1 text-neutral-600 dark:text-neutral-400">
                  Type d'arnaque
                </label>
                <select
                  value={scamType}
                  onChange={(e) => setScamType(e.target.value)}
                  className="w-full rounded border px-3 py-2 text-sm
                            border-neutral-300 dark:border-neutral-700
                            bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100
                            focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                >
                  {SCAM_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <TextField
                label="Ville / Lieu"
                value={city}
                onCommit={(v) => setCity(v)}
                placeholder="Abidjan…"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs mb-1 text-neutral-600 dark:text-neutral-400">
                  Date
                </label>
                <TextField value={date} onCommit={(v) => setDate(v)} type="date" />
              </div>
            </div>

            {scenario === "phone" && (
              <TextField
                label="Numéro de téléphone"
                value={phone}
                onCommit={(v) => setPhone(v)}
                placeholder="+225 01 23 45 67"
              />
            )}
            {scenario === "person" && (
              <TextField
                label="Nom complet"
                value={fullName}
                onCommit={(v) => setFullName(v)}
                placeholder="K. D. N'Guessan"
              />
            )}
            {scenario === "vehicle" && (
              <TextField
                label="Plaque d'immatriculation"
                value={plate}
                onCommit={(v) => setPlate(v)}
                placeholder="1234-HJ-01"
              />
            )}
            {scenario === "company" && (
              <TextField
                label="Entreprise / Marque"
                value={brand}
                onCommit={(v) => setBrand(v)}
                placeholder="Orange CI"
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextField
                label="Site web"
                value={website}
                onCommit={(v) => setWebsite(v)}
                placeholder="https://…"
              />
              <TextField
                label="Réseaux sociaux"
                value={socials}
                onCommit={(v) => setSocials(v)}
                placeholder="@pseudo, lien Insta/TikTok…"
              />
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
                className="cursor-pointer rounded border px-3 py-2 text-sm
                           border-neutral-300 bg-white hover:bg-neutral-50
                           dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
              >
                + Ajouter des médias
              </label>
              <span className="text-xs text-neutral-600 dark:text-neutral-500">
                {files.length}/{MAX_FILES}
              </span>
            </div>

            {files.length > 0 && (
              <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {files.map((f) => (
                  <li
                    key={f.localUrl}
                    className="relative rounded-md overflow-hidden border
                               border-neutral-300 bg-neutral-100
                               dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    {f.mime?.startsWith("image/") ? (
                      <img
                        src={f.localUrl}
                        alt={f.name}
                        className="h-28 w-full object-cover"
                      />
                    ) : f.mime?.startsWith("video/") ? (
                      <video
                        src={f.localUrl}
                        className="h-28 w-full object-cover"
                      />
                    ) : (
                      <div className="h-28 grid place-items-center text-xs p-2 break-words text-neutral-600 dark:text-neutral-400">
                        {f.name || f.mime}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(f.localUrl)}
                      className="absolute right-1 top-1 rounded bg-black/60 px-1 text-xs text-white"
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
            <div className="text-sm text-neutral-700 dark:text-neutral-300">
              Réponds brièvement : <em>Que s’est-il passé ?</em>{" "}
              <em>Quel préjudice (montant / perte) ?</em>{" "}
              <em>As-tu contacté la police ?</em>
            </div>
            <TextField
              as="textarea"
              rows={6}
              value={story}
              onCommit={(v) => setStory(v)}
              placeholder={`Min. ${MIN_STORY} caractères. Donne des faits utiles (dates, montants, échanges, etc.).`}
            />
            <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
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
            <div
              className="rounded border p-3
                            border-neutral-300 bg-white
                            dark:border-neutral-800 dark:bg-neutral-900/60"
            >
              <div className="font-medium text-neutral-900 dark:text-neutral-100">
                {title}
              </div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400">
                {scamType} • {city || "Lieu inconnu"} •{" "}
                {date || "Date inconnue"}
              </div>
              <div className="mt-2 whitespace-pre-wrap text-neutral-800 dark:text-neutral-100">
                {story}
              </div>
              {files.length > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-1">
                  {files.map((f) => (
                    <img
                      key={f.localUrl}
                      src={f.localUrl}
                      alt="evidence"
                      className="h-24 w-full object-cover rounded"
                    />
                  ))}
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 text-neutral-800 dark:text-neutral-100">
              <input
                type="checkbox"
                className="accent-violet-600 dark:accent-white"
                checked={agreedRules}
                onChange={(e) => setAgreedRules(e.target.checked)}
              />
              J’accepte les règles : faux signalement = bannissement.
            </label>
            <label className="flex items-center gap-2 text-neutral-800 dark:text-neutral-100">
              <input
                type="checkbox"
                className="accent-violet-600 dark:accent-white"
                checked={confirmTruth}
                onChange={(e) => setConfirmTruth(e.target.checked)}
              />
              Je certifie l’exactitude de mon témoignage.
            </label>
            {skippedKyc && (
              <div
                className="rounded border p-2 text-xs
                              border-yellow-300 bg-yellow-50 text-yellow-800
                              dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-100"
              >
                Astuce : la vérification d’identité peut accélérer la validation
                de votre signalement.
              </div>
            )}
            {publishMutation.isError && (
              <div className="text-xs text-red-700 dark:text-red-300">
                Échec de la publication. Vérifie la console / logs serveur.
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(5)}
                className="rounded border px-3 py-1 text-sm
                           border-neutral-300 text-neutral-700 hover:bg-neutral-50
                           dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
              >
                Retour
              </button>

              <button
                type="button"
                onClick={() => publishMutation.mutate()}
                disabled={!canPublish || publishMutation.isPending}
                className="rounded bg-white px-3 py-1 text-sm font-medium text-black hover:opacity-90 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
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
