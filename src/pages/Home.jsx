import React from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";

/* Icônes (SVG inline, teintées via Tailwind) */
const IconReport = ({ className = "h-6 w-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path d="M7 3h7l3 3v15H7V3Z" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="M10 8h5M10 12h5M10 16h5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);
const IconSearch = ({ className = "h-6 w-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="m16.5 16.5 4 4"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);
const IconBell = ({ className = "h-6 w-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path
      d="M6 14v-2a6 6 0 1 1 12 0v2c0 2-1 3-3 3H9c-2 0-3-1-3-3Z"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <path
      d="M10 17a2 2 0 0 0 4 0"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);
const IconShield = ({ className = "h-6 w-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path
      d="M12 3 5 6v6c0 5 7 9 7 9s7-4 7-9V6l-7-3Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.5 12.5 11 14l3.5-3.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const IconId = ({ className = "h-6 w-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <rect
      x="3"
      y="5"
      width="18"
      height="14"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <circle cx="8" cy="10" r="1.6" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="M6.5 14c.9-1 2.4-1.5 4.5-1.5S14.6 13 15.5 14"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path
      d="M13 9.5h5M13 12h5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);
const IconGlobe = ({ className = "h-6 w-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center py-8">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(124,58,237,0.18),transparent_60%),radial-gradient(800px_400px_at_-10%_20%,rgba(147,51,234,0.12),transparent_60%),radial-gradient(900px_480px_at_110%_30%,rgba(99,102,241,0.12),transparent_60%)]">
          {/* HERO SECTION */}
          <section className="px-6 py-12 sm:px-10 sm:py-16 lg:px-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Texte Principal */}
              <div className="max-w-2xl">
                <div
                  className="inline-flex items-center gap-2 text-xs font-medium tracking-wide 
                              text-violet-800 dark:text-violet-200
                                bg-violet-100/80 dark:bg-violet-900/25
                                px-3 py-1 rounded-full mb-6"
                >
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span>DOHI — communauté anti-arnaques</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-neutral-900 dark:text-white mb-6">
                  Alerte, <br />
                  <span
                    className="text-transparent bg-clip-text bg-gradient-to-r 
                                    from-violet-700 to-amber-600 
                                    dark:from-violet-300 to-amber-300"
                  >
                    vérifie,
                  </span>{" "}
                  <br />
                  protège-toi.
                </h1>

                <p className="text-lg text-neutral-900 dark:text-neutral-300 max-w-xl mb-8 leading-relaxed">
                  Dépose un signalement en 2 minutes, vérifie une identité avant
                  d&apos;acheter, et reçois des alertes lorsque des profils
                  suspects sont détectés.
                </p>

                {/* Actions Principales */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Link to="/reports/new" className="block">
                    <div className="rounded-xl bg-neutral-900/60 p-5 border border-neutral-200 dark:border-neutral-800 hover:border-violet-500/30 transition-all duration-300 cursor-pointer">
                      <IconReport className="h-8 w-8 text-violet-300 mb-3" />
                      <div className="text-base font-semibold text-white mb-2">
                        Signaler un cas
                      </div>
                      <p className="text-sm text-neutral-300 leading-relaxed">
                        Ajoute des preuves pour protéger la communauté.
                      </p>
                    </div>
                  </Link>
                  <Link to="/verify" className="block">
                    <div className="rounded-xl bg-neutral-900/60 p-5 border border-neutral-200 dark:border-neutral-800 hover:border-violet-500/30 transition-all duration-300 cursor-pointer">
                      <IconSearch className="h-8 w-8 text-amber-300 mb-3" />
                      <div className="text-base font-semibold text-white mb-2">
                        Vérifier un profil
                      </div>
                    <p className="text-sm text-neutral-300 leading-relaxed">
                      Recherche par nom, téléphone, IBAN, pseudo…
                    </p>
                    </div>
                  </Link>
                  <div className="rounded-xl bg-neutral-900/60 p-5 border border-neutral-200 dark:border-neutral-800 hover:border-violet-500/30 transition-all duration-300">
                    <IconBell className="h-8 w-8 text-amber-400 mb-3" />
                    <div className="text-base font-semibold text-white mb-2">
                      Recevoir des alertes
                    </div>
                    <p className="text-sm text-neutral-300 leading-relaxed">
                      Suis l&apos;évolution d&apos;un cas et les récidives.
                    </p>
                  </div>
                </div>
              </div>

              {/* Illustration */}
              <div className="relative">
                {/* Halo discret, mais pas de gros bloc derrière l'image */}
                <div
                  className="pointer-events-none absolute -inset-8 -top-10 opacity-40 blur-2xl"
                  style={{
                    background:
                      "radial-gradient(ellipse at center, #7c3aed35, transparent 60%)",
                  }}
                />
                <div className="relative rounded-3xl border border-neutral-200/60 dark:border-neutral-800/80 bg-gradient-to-br from-violet-700/40 via-neutral-950 to-amber-400/20 p-3 shadow-xl">
                  <img
                    src="./assets/hero.png"
                    alt="Illustration OS Scammer"
                    className="block w-full max-w-xl h-auto rounded-2xl object-cover mx-auto"
                  />
                </div>

                {/* Badges d'info – cachés sur mobile */}
                <div className="mt-6 hidden sm:grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-neutral-900/60 p-4 flex items-center gap-3 border border-neutral-200 dark:border-neutral-800">
                    <IconGlobe className="h-5 w-5 text-violet-300 shrink-0" />
                    <span className="text-sm font-medium text-neutral-200 leading-tight">
                      28 pays
                    </span>
                  </div>
                  <div className="rounded-xl bg-neutral-900/60 p-4 flex items-center gap-3 border border-neutral-200 dark:border-neutral-800">
                    <IconShield className="h-5 w-5 text-amber-300 shrink-0" />
                    <span className="text-sm font-medium text-neutral-200 leading-tight">
                      Sécurité
                    </span>
                  </div>
                  <div className="rounded-xl bg-neutral-900/60 p-4 flex items-center gap-3 border border-neutral-200 dark:border-neutral-800">
                    <IconId className="h-5 w-5 text-violet-300 shrink-0" />
                    <span className="text-sm font-medium text-neutral-200 leading-tight">
                      KYC
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* COMMENT ÇA MARCHE SECTION */}
          <section className="px-6 pb-12 sm:px-10 lg:px-16">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-white mb-3">
                Comment ça marche
              </h2>
              <p className="text-lg text-neutral-900 dark:text-neutral-300 max-w-2xl mx-auto">
                Un processus simple et efficace pour lutter contre les arnaques
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
              {/* Étape 1 */}
              <div className="rounded-2xl bg-neutral-900/50 p-6 border border-neutral-200 dark:border-neutral-800 hover:border-violet-500/30 transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-black text-sm font-bold">
                    1
                  </span>
                  <span className="text-lg font-semibold text-white">
                    Créer un signalement
                  </span>
                </div>
                <p className="text-neutral-300 mb-4 leading-relaxed">
                  Remplis le formulaire et ajoute des pièces justificatives en
                  quelques minutes.
                </p>
                <img
                  src="/assets/steps/step1.png"
                  alt="Étape 1"
                  className="mt-3 block w-full h-32 rounded-lg object-cover"
                />
              </div>

              {/* Étape 2 */}
              <div className="rounded-2xl bg-neutral-900/50 p-6 border border-neutral-200 dark:border-neutral-800 hover:border-violet-500/30 transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-black text-sm font-bold">
                    2
                  </span>
                  <span className="text-lg font-semibold text-white">
                    Vérifier une identité
                  </span>
                </div>
                <p className="text-neutral-300 mb-4 leading-relaxed">
                  Recherche par nom, téléphone, IBAN, pseudo, page sociale en
                  temps réel.
                </p>
                <img
                  src="/assets/steps/step2.png"
                  alt="Étape 2"
                  className="mt-3 block w-full h-32 rounded-lg object-cover"
                />
              </div>

              {/* Étape 3 */}
              <div className="rounded-2xl bg-neutral-900/50 p-6 border border-neutral-200 dark:border-neutral-800 hover:border-violet-500/30 transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-black text-sm font-bold">
                    3
                  </span>
                  <span className="text-lg font-semibold text-white">
                    Croiser les preuves
                  </span>
                </div>
                <p className="text-neutral-300 mb-4 leading-relaxed">
                  Nos outils relient automatiquement les cas similaires pour
                  repérer des schémas récurrents.
                </p>
                <img
                  src="/assets/steps/step3.png"
                  alt="Étape 3"
                  className="mt-3 block w-full h-32 rounded-lg object-cover"
                />
              </div>

              {/* Étape 4 */}
              <div className="rounded-2xl bg-neutral-900/50 p-6 border border-neutral-200 dark:border-neutral-800 hover:border-violet-500/30 transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-black text-sm font-bold">
                    4
                  </span>
                  <span className="text-lg font-semibold text-white">
                    Être alerté
                  </span>
                </div>
                <p className="text-neutral-300 mb-4 leading-relaxed">
                  Reçois des notifications pertinentes lorsqu&apos;il y a du
                  nouveau sur un cas que tu suis.
                </p>
                <img
                  src="/assets/steps/step4.png"
                  alt="Étape 4"
                  className="mt-3 block w-full h-32 rounded-lg object-cover"
                />
              </div>
            </div>

            {/* Section Confiance & Sécurité */}
            <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="rounded-2xl bg-neutral-900/50 p-6 border border-neutral-200 dark:border-neutral-800 flex items-start gap-4">
                <IconShield className="h-8 w-8 text-violet-300 shrink-0 mt-1" />
                <div>
                  <div className="text-lg font-semibold text-white mb-2">
                    Protection des données
                  </div>
                  <p className="text-neutral-300 leading-relaxed">
                    Données sensibles chiffrées de bout en bout, stockage
                    sécurisé et conformité RGPD.
                  </p>
                </div>
              </div>
              <div className="rounded-2xl bg-neutral-900/50 p-6 border border-neutral-200 dark:border-neutral-800 flex items-start gap-4">
                <IconId className="h-8 w-8 text-amber-300 shrink-0 mt-1" />
                <div>
                  <div className="text-lg font-semibold text-white mb-2">
                    Vérifications multiples
                  </div>
                  <p className="text-neutral-300 leading-relaxed">
                    KYC avancé, validations communautaires et vérifications
                    croisées.
                  </p>
                </div>
              </div>
              <div className="rounded-2xl bg-neutral-900/50 p-6 border border-neutral-200 dark:border-neutral-800 flex items-start gap-4">
                <IconBell className="h-8 w-8 text-amber-400 shrink-0 mt-1" />
                <div>
                  <div className="text-lg font-semibold text-white mb-2">
                    Alertes intelligentes
                  </div>
                  <p className="text-neutral-300 leading-relaxed">
                    Mises à jour ciblées, système anti-spam et notifications
                    personnalisées.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
