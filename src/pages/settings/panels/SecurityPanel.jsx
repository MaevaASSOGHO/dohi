import { useState } from "react";
import { api } from "../../../lib/api"; // ← ou: import { api } from "../../lib/api";

export default function SecurityPanel() {
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const onChangePassword = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;                 // ✅ capture avant await
    const fd = new FormData(form);
    setLoading(true);
    try {
      await api.post("/auth/change-password", {
        current_password: fd.get("current_password"),
        new_password: fd.get("new_password"),
      });
      alert("Mot de passe modifié");
      form.reset();                               // ✅ safe reset
      setShowCurrent(false);
      setShowNew(false);
    } finally {
      setLoading(false);
    }
  };

  const onLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (_) {
      // même si l'appel échoue, on purge localement
    } finally {
      localStorage.removeItem("token");
      window.location.assign("/login");
    }
  };

  return (
    <div className="grid gap-6">
      <form onSubmit={onChangePassword} className="grid gap-3">
        <h3 className="font-medium">Changer le mot de passe</h3>

        <div className="relative">
          <input
            name="current_password"
            type={showCurrent ? "text" : "password"}
            placeholder="Mot de passe actuel"
            className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 pr-10"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowCurrent((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-200"
            aria-label={showCurrent ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {showCurrent ? (
              // EyeOff (inline)
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M3 3l18 18M10.58 10.59A2 2 0 0012 14a2 2 0 001.42-.59M9.88 4.24A9.53 9.53 0 0112 4c5 0 9 4 10 8-.27 1.22-.84 2.35-1.64 3.32M6.1 6.1C4.15 7.55 2.73 9.57 2 12c1 4 5 8 10 8 1.2 0 2.35-.2 3.41-.57"/>
              </svg>
            ) : (
              // Eye (inline)
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z"/>
                <circle cx="12" cy="12" r="3" strokeWidth="2" />
              </svg>
            )}
          </button>
        </div>

        <div className="relative">
          <input
            name="new_password"
            type={showNew ? "text" : "password"}
            placeholder="Nouveau mot de passe"
            className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 pr-10"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowNew((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-200"
            aria-label={showNew ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {showNew ? (
              // EyeOff
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M3 3l18 18M10.58 10.59A2 2 0 0012 14a2 2 0 001.42-.59M9.88 4.24A9.53 9.53 0 0112 4c5 0 9 4 10 8-.27 1.22-.84 2.35-1.64 3.32M6.1 6.1C4.15 7.55 2.73 9.57 2 12c1 4 5 8 10 8 1.2 0 2.35-.2 3.41-.57"/>
              </svg>
            ) : (
              // Eye
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z"/>
                <circle cx="12" cy="12" r="3" strokeWidth="2" />
              </svg>
            )}
          </button>
        </div>

        <button
          disabled={loading}
          className="rounded bg-violet-600 px-4 py-2 text-sm font-medium"
        >
          {loading ? "…" : "Mettre à jour"}
        </button>
      </form>

      {/* <div className="border-t border-neutral-800 pt-4">
        <h3 className="mb-2 font-medium">Session</h3>
        <button
          onClick={onLogout}
          className="rounded border border-red-700 bg-red-900/30 px-4 py-2 text-sm text-red-200"
        >
          Se déconnecter
        </button>
      </div> */}
    </div>
  );
}
