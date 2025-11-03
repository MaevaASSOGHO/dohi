import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="relative isolate overflow-hidden rounded-2xl border border-neutral-800/70 bg-neutral-950/60 backdrop-blur">
      {/* Hero */}
      <section className="px-6 py-10 sm:px-10 sm:py-14 lg:px-16">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 text-xs font-medium tracking-wide text-violet-300/90 bg-violet-950/30 ring-1 ring-violet-800/50 px-3 py-1 rounded-full mb-4">
            OS Scammer — communauté anti-arnaques
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-white">
            Dénonce, vérifie, protège-toi.
          </h1>
          <p className="mt-4 text-neutral-300 max-w-2xl">
            Centralise les signalements, vérifie l’identité des vendeurs, et suis l’évolution des cas.
            Ensemble, on assainit l’écosystème.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to="/reports/new"
              className="btn-dark"
            >
              ✍️ Nouveau signalement
            </Link>
            <Link
              to="/discover"
              className="btn-ghost"
            >
              🔎 Explorer les cas
            </Link>
            <Link
              to="/feed"
              className="btn-ghost"
            >
              📰 Fil d’actualité
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { k: "Signalements", v: "12 438+" },
            { k: "Vérifications", v: "7 920+" },
            { k: "Alertes envoyées", v: "32 k" },
            { k: "Pays couverts", v: "28" },
          ].map((s) => (
            <div key={s.k} className="rounded-xl border border-neutral-800/60 bg-neutral-900/50 px-4 py-3">
              <div className="text-lg sm:text-xl font-bold text-white">{s.v}</div>
              <div className="text-xs text-neutral-400">{s.k}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Derniers signalements (placeholder, tu peux brancher l’API ensuite) */}
      <section className="px-6 pb-10 sm:px-10 lg:px-16">
        <h2 className="text-xl font-semibold text-white mb-3">Derniers signalements</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="rounded-xl border border-neutral-800/60 bg-neutral-900/40 p-4">
              <div className="h-40 w-full rounded-lg bg-neutral-800/60 mb-3" />
              <div className="h-3 w-2/3 bg-neutral-800/70 rounded mb-2" />
              <div className="h-3 w-1/2 bg-neutral-800/60 rounded" />
            </div>
          ))}
        </div>
        <div className="mt-6">
          <Link to="/discover" className="btn-line">Voir plus →</Link>
        </div>
      </section>
    </div>
  );
}
