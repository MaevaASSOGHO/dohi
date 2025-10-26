import { useRouteError } from "react-router-dom";

export default function ErrorFallback() {
  const err = useRouteError();
  return (
    <div className="mx-auto max-w-lg rounded border border-red-800 bg-red-900/20 p-4">
      <h1 className="text-lg font-semibold text-red-200">Oups…</h1>
      <p className="text-sm text-red-300 mt-1">
        Une erreur est survenue. Réessaie plus tard.
      </p>
      {import.meta.env.DEV && (
        <pre className="mt-3 overflow-auto text-xs text-red-200">
          {err?.status} {err?.statusText || ""} {err?.message || ""}
        </pre>
      )}
    </div>
  );
}
