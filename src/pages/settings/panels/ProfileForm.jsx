import { useEffect, useRef, useState } from "react";
import { api } from "../../../lib/api";
export default function ProfileForm() {
  const [me, setMe] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    api.get("/me").then(res => setMe(res.data));
  }, []);

  const onSave = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await api.put("/me", {
      name: fd.get("name") || null,
      city: fd.get("city") || null,
      phone: fd.get("phone") || null,
    });
    alert("Profil mis à jour");
  };

  const onUploadAvatar = async (file) => {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post("/me/avatar", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setMe(m => ({ ...m, avatar_url: res.data.avatar_url }));
  };

  if (!me) return <div>Chargement…</div>;

  return (
    <form onSubmit={onSave} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="col-span-1 sm:col-span-2 flex items-center gap-3">
        <img
          src={me.avatar_url || "https://placehold.co/96x96?text=Avatar"}
          alt=""
          className="h-16 w-16 rounded-full object-cover border border-neutral-700"
        />
        <div>
          <button
            type="button"
            onClick={()=>fileRef.current?.click()}
            className="rounded border border-neutral-700 px-3 py-1 text-sm bg-neutral-800"
          >
            Changer la photo
          </button>
          <input ref={fileRef} type="file" hidden accept="image/*"
            onChange={(e)=> e.target.files?.[0] && onUploadAvatar(e.target.files[0])}/>
        </div>
      </div>

      <div>
        <label className="block text-xs text-neutral-400">Nom complet</label>
        <input name="name" defaultValue={me.name || ""} className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2" />
      </div>
      <div>
        <label className="block text-xs text-neutral-400">Ville</label>
        <input name="city" defaultValue={me.city || ""} className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2" />
      </div>
      <div>
        <label className="block text-xs text-neutral-400">Téléphone</label>
        <input name="phone" defaultValue={me.phone || ""} className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2" />
      </div>

      <div className="col-span-1 sm:col-span-2">
        <button className="rounded bg-violet-600 px-4 py-2 text-sm font-medium">Enregistrer</button>
      </div>
    </form>
  );
}
