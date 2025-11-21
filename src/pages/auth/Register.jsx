import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "../../lib/api";
import { registerViaApi } from "../../lib/api";
import { Link, useNavigate } from "react-router-dom";

const schema = z.object({
  name: z.string().min(2, "Nom trop court"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Au moins 8 caractères"),
  confirm: z.string().min(8, "Confirme le mot de passe"),
}).refine((data) => data.password === data.confirm, {
  path: ["confirm"],
  message: "Les mots de passe ne correspondent pas",
});

export default function Register() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", confirm: "" },
  });

  const onSubmit = async (values) => {
    setServerError("");
    try {
      const payload = {
        name: values.name,
        email: values.email,
        password: values.password,
        password_confirmation: values.confirm,
      };
      const { data } = await registerViaApi(payload);
      const token = data?.token || data?.access_token || null;
      if (token) localStorage.setItem("token", token);
      navigate("/", { replace: true });
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
    <div className="mx-auto max-w-md rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white/80 dark:bg-neutral-900/60 p-6 backdrop-blur-sm">
      <h1 className="text-2xl font-semibold mb-6 text-neutral-900 dark:text-neutral-100">Créer un compte</h1>

      {serverError ? (
        <div className="mb-4 rounded border border-red-300 dark:border-red-800 bg-red-100 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-200">
          {serverError}
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Nom / Pseudo</label>
          <input
            {...register("name")}
            className="w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-neutral-900 dark:text-neutral-100"
            placeholder="Ex. Meezy"
            autoComplete="name"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            {...register("email")}
            type="email"
            className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2"
            placeholder="exemple@mail.com"
            autoComplete="email"
          />
          {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm mb-1">Mot de passe</label>
          <div className="relative">
            <input
              {...register("password")}
              type={showPwd ? "text" : "password"}
              className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 pr-10"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPwd((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPwd ? (
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
          {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-sm mb-1">Confirmer le mot de passe</label>
          <div className="relative">
            <input
              {...register("confirm")}
              type={showPwd ? "text" : "password"}
              className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 pr-10"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPwd((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-200"
              aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPwd ? (
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
          {errors.confirm && <p className="mt-1 text-sm text-red-400">{errors.confirm.message}</p>}
        </div>

        <button
          disabled={isSubmitting}
          className="w-full rounded bg-neutral-900 dark:bg-white px-4 py-2 font-medium text-white dark:text-black hover:opacity-90 disabled:opacity-60"
        >
          {isSubmitting ? "Création en cours…" : "Créer mon compte"}
        </button>

        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Déjà un compte ? <Link to="/login" className="underline text-neutral-900 dark:text-neutral-300 hover:text-neutral-700 dark:hover:text-white">Se connecter</Link>
        </p>
      </form>
    </div>
  );
}
