import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

export default function NotificationSettings() {
  const [s, setS]   = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg]   = useState("");

  useEffect(() => {
    api.get("/me/notification-settings")
      .then(({data}) => setS(data))
      .catch(()=> setS({ email_digest:'none', push_votes:false, push_comments:true, push_moderation:true }));
  }, []);

  const save = async () => {
    setBusy(true); setMsg("");
    try {
      await api.put("/me/notification-settings", s);
      setMsg("Réglages enregistrés.");
    } catch { setMsg("Échec de l’enregistrement."); }
    finally { setBusy(false); }
  };

  if (!s) return null;

  return (
    <div className="rounded-xl border border-neutral-800 p-4">
      <h2 className="mb-3 text-lg font-semibold">Réglages des notifications</h2>
      <div className="grid gap-3">
        <div>
          <label className="block text-sm mb-1">Résumé par email</label>
          <select
            value={s.email_digest}
            onChange={e=>setS(prev=>({...prev, email_digest:e.target.value}))}
            className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm"
          >
            <option value="none">Aucun</option>
            <option value="daily">Quotidien</option>
            <option value="weekly">Hebdomadaire</option>
          </select>
        </div>

        <Toggle label="Push — votes reçus" checked={s.push_votes} onChange={v=>setS(p=>({...p, push_votes:v}))} />
        <Toggle label="Push — nouveaux commentaires" checked={s.push_comments} onChange={v=>setS(p=>({...p, push_comments:v}))} />
        <Toggle label="Push — mise à jour modération" checked={s.push_moderation} onChange={v=>setS(p=>({...p, push_moderation:v}))} />

        <div className="flex items-center gap-2">
          <button disabled={busy} onClick={save} className="rounded bg-white px-3 py-1.5 text-sm font-medium text-black hover:opacity-90 disabled:opacity-60">
            {busy ? "Enregistrement…" : "Enregistrer"}
          </button>
          {msg && <span className="text-xs text-neutral-400">{msg}</span>}
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
