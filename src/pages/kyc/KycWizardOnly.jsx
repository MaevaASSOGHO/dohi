import { useLocation, useNavigate } from "react-router-dom";
import KycWizard from "../settings/panels/KycWizard";

export default function KycWizardOnly() {
  const navigate = useNavigate();
  const { state } = useLocation(); // { from: "/reports/new" } par ex.
  const backTo = state?.from || "/settings?tab=kyc"; // fallback propre

  return (
    <div className="mx-auto max-w-2xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Vérification d’identité</h1>
        <button
          onClick={() => navigate(backTo)}
          className="rounded border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-800"
        >
          Revenir
        </button>
      </div>

      {/* Tu peux exposer un onSubmitted() depuis KycWizard, sinon laisse l’alert côté composant */}
      <KycWizard />
    </div>
  );
}
