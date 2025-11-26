import { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { api } from "../../lib/api";
import { loginViaApi } from "../../lib/api";
import { Link, useNavigate, useLocation } from "react-router-dom";

function ForgotPasswordModal({ open, onClose }) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({ defaultValues: { email: "" }});
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  async function onSubmit(values) {
    setMsg(null);
    setErr(null);
    try {
      // ⬇️ IMPORTANT : on passe par Vercel, pas par api.js
      await axios.post(
        "/api/login-proxy?action=forgot",
        values,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      setMsg(
        "Si un compte existe pour cet email, un lien de réinitialisation a été envoyé."
      );
    } catch (e) {
      const m =
        e?.response?.data?.message ||
        "Impossible d'envoyer le lien pour le moment.";
      setErr(m);
    }
  }


  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/70 grid place-items-center px-4">
      <div className="w-full max-w-md rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Mot de passe oublié</h4>
          <button onClick={onClose} className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">✕</button>
        </div>

        {msg && <div className="mb-3 rounded border border-emerald-300 dark:border-emerald-800 bg-emerald-100 dark:bg-emerald-900/30 p-3 text-sm text-emerald-700 dark:text-emerald-200">{msg}</div>}
        {err && <div className="mb-3 rounded border border-red-300 dark:border-red-800 bg-red-100 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-200">{err}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-neutral-700 dark:text-neutral-300">Email</label>
            <input
              {...register("email", { required: true })}
              type="email"
              className="w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-neutral-100"
              placeholder="exemple@mail.com"
              autoComplete="email"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/50">
              Annuler
            </button>
            <button disabled={isSubmitting} className="px-3 py-2 rounded bg-neutral-900 dark:bg-white text-white dark:text-black hover:opacity-90 disabled:opacity-60">
              {isSubmitting ? "Envoi…" : "Envoyer le lien"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [serverError, setServerError] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: { email: "", password: "" }
  });

  const onSubmit = async (values) => {
    setServerError("");
    try {
      const { data } = await loginViaApi(values);
      const token = data?.token || data?.access_token;
      if (token) localStorage.setItem("token", token);
      window.dispatchEvent(new Event("auth:changed")); // ⬅️ met à jour la sidebar
      const dest = state?.from || "/feed";
      navigate(dest, { replace: true });
    } catch (e) {
      const status = e?.response?.status;
      const firstError =
        e?.response?.data?.errors && Object.values(e.response.data.errors).flat()[0];
      setServerError(
        firstError ||
          e?.response?.data?.message ||
          `Erreur (status ${status || "no-response"})`
      );
    }
  };


  return (
    <div className="mx-auto max-w-md rounded-2xl border border-violet-200/50 dark:border-violet-900/80 bg-white/80 dark:bg-neutral-900/60 p-6 backdrop-blur-sm">
      <h3 className="mb-6 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Se connecter</h3>

      {serverError && (
        <div className="mb-4 rounded border border-red-300 dark:border-red-800 bg-red-100 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-200">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-neutral-700 dark:text-neutral-300">Email</label>
          <input
            {...register("email", { required: true })}
            type="email"
            className="w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-neutral-900 dark:text-neutral-100"
            autoComplete="email"
            placeholder="exemple@mail.com"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-neutral-700 dark:text-neutral-300">Mot de passe</label>
          <div className="relative">
            <input
              {...register("password", { required: true })}
              type={showPwd ? "text" : "password"}
              className="w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 pr-10 text-neutral-900 dark:text-neutral-100"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPwd(s => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPwd ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M3 3l18 18M10.58 10.59A2 2 0 0012 14a2 2 0 001.42-.59M9.88 4.24A9.53 9.53 0 0112 4c5 0 9 4 10 8-.27 1.22-.84 2.35-1.64 3.32M6.1 6.1C4.15 7.55 2.73 9.57 2 12c1 4 5 8 10 8 1.2 0 2.35-.2 3.41-.57"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z"/>
                  <circle cx="12" cy="12" r="3" strokeWidth="2" />
                </svg>
              )}
            </button>
          </div>

          <div className="mt-2 text-right">
            <button type="button" onClick={() => setForgotOpen(true)} className="text-sm text-neutral-600 dark:text-neutral-300 underline hover:text-neutral-900 dark:hover:text-white">
              Mot de passe oublié ?
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded bg-neutral-900 dark:bg-white px-4 py-2 font-medium text-white dark:text-black hover:opacity-90 disabled:opacity-60"
        >
          {isSubmitting ? "Connexion…" : "Se connecter"}
        </button>

        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Pas de compte ? <Link to="/register" className="underline text-neutral-900 dark:text-neutral-300 hover:text-neutral-700 dark:hover:text-white">Créer un compte</Link>
        </p>
      </form>

      <ForgotPasswordModal open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </div>
  );
}