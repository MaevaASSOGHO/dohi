import { useState } from "react";
import ProfileForm from "./panels/ProfileForm";
import SecurityPanel from "./panels/SecurityPanel";
import KycWizard from "./panels/KycWizard";
import MyReportsPanel from "./panels/MyReportsPanel";
import ModerationPanel from "./panels/ModerationPanel";
import NotificationSettings from "./panels/NotificationSettings";


const TABS = [
  { key: "profile",    label: "Profil" },
  { key: "security",   label: "Sécurité" },
  { key: "kyc",        label: "Vérification d’identité" },
  { key: "myreports",  label: "Mes signalements" },
  { key: "moderation", label: "Modération" },
  { key: "notifications", label: "Notifications" }
];

export default function Settings() {
  const [tab, setTab] = useState("profile");

  return (
    <div className="mx-auto max-w-4xl p-4">

      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-2xl font-semibold">Paramètres</h3>
        <button
          onClick={async ()=>{ try{ await api.post("/auth/logout"); }catch(_){} finally { localStorage.removeItem("token"); window.location.assign("/login"); } }}
          className="rounded border border-red-700 bg-red-900/30 px-3 py-1.5 text-sm text-red-200"
        >
          Se déconnecter
        </button>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={()=>setTab(t.key)}
            className={`rounded-full px-3 py-1 text-sm border ${
              tab === t.key ? "bg-violet-600 text-white border-violet-600" : "bg-neutral-900 border-neutral-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
        {tab === "profile"    && <ProfileForm />}
        {tab === "security"   && <SecurityPanel />}
        {tab === "kyc"        && <KycWizard />}
        {tab === "myreports"  && <MyReportsPanel />}
        {tab === "moderation" && <ModerationPanel />}
        {tab === "notifications" && <NotificationSettings />}
      </div>
    </div>
  );
}
