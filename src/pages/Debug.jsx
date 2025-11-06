import { useEffect, useState } from "react";
import { api } from "../lib/api"; // adapte le chemin si différent

export default function Debug() {
  const [env, setEnv] = useState("");
  const [ping, setPing] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    // 1) Afficher la base API telle que vue par le front
    setEnv(import.meta.env.VITE_API_BASE || "(vide)");

    // 2) Tester l’API : /api/ping
    (async () => {
      try {
        const r = await api.get("/api/ping");
        setPing(r.data);
      } catch (e) {
        setErr(e?.message || "Erreur inconnue");
      }
    })();
  }, []);

  return (
    <main className="min-h-dvh p-6 text-white bg-black">
      <h1 className="text-2xl font-bold mb-4">Debug Réseau</h1>

      <div className="space-y-3">
        <div className="p-3 rounded-lg bg-neutral-900 ring-1 ring-neutral-800">
          <div className="text-sm text-neutral-400">VITE_API_BASE</div>
          <div className="font-mono text-violet-300 break-all">{env}</div>
        </div>

        <div className="p-3 rounded-lg bg-neutral-900 ring-1 ring-neutral-800">
          <div className="text-sm text-neutral-400">API /api/ping</div>
          {ping ? (
            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(ping, null, 2)}</pre>
          ) : err ? (
            <div className="text-red-400">Erreur: {err}</div>
          ) : (
            <div className="text-neutral-400">Test en cours…</div>
          )}
        </div>
      </div>
    </main>
  );
}
