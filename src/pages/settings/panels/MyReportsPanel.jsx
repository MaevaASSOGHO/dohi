import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import ReportListItem from "../../../components/report/ReportListItem";

export default function MyReportsPanel() {
  const [items, setItems] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    api.get("/me/reports").then(res => setItems(res.data?.items || []));
  }, []);

  const onDelete = async (id) => {
   if (!confirm("Supprimer ce signalement ? Cette action est réversible par l’équipe, mais il disparaîtra du fil.")) return;
   setBusyId(id);
   try {
     await api.delete(`/reports/${id}`);
     setItems(list => list.filter(it => it.id !== id)); // Optimistic update
   } catch (e) {
     alert(e?.response?.data?.message || "Suppression impossible.");
   } finally {
     setBusyId(null);
   }
 };

  if (!items) return <div>Chargement…</div>;
  if (items.length === 0) return <div className="text-sm text-neutral-400">Aucun signalement pour l’instant.</div>;

  return (
    <div className="grid gap-3">
     {items.map(it => (
       <div key={it.id} className="flex items-start gap-3">
         <div className="flex-1">
           <ReportListItem item={it} />
         </div>
         <button
           onClick={() => onDelete(it.id)}
           disabled={busyId === it.id}
           className="h-9 w-9 grid place-items-center shrink-0 rounded border border-red-700 bg-red-900/30 hover:bg-red-900/50 disabled:opacity-60"
           title="Supprimer le signalement"
           aria-label="Supprimer le signalement"
         >
           {busyId === it.id ? (
             <span className="text-red-200 text-sm">…</span>
           ) : (
             // Icône “trash” inline (24x24 downscaled par CSS)
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
               <polyline points="3 6 5 6 21 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
               <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
               <path d="M10 11v6M14 11v6" strokeWidth="2" strokeLinecap="round"/>
               <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
             </svg>
           )}
         </button>
       </div>
     ))}
   </div>
  );
}