import { useEffect, useState } from "react";
import NotificationItem from "./NotificationItem";
import { api } from "../../lib/api";

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [page, setPage]   = useState(1);
  const [total, setTotal] = useState(0);
  const [only, setOnly]   = useState("all"); // 'all' | 'unread'
  const [busy, setBusy]   = useState(false);

  const load = async (p=1) => {
    setBusy(true);
    try {
      const { data } = await api.get("/notifications", { params: { page: p, pageSize: 20, only } });
      setItems(data.items || []);
      setPage(data.page || 1);
      setTotal(data.total || 0);
    } finally { setBusy(false); }
  };

  useEffect(() => { load(1); }, [only]);

  const markAllRead = async () => {
    await api.post("/notifications/read-all");
    load(page);
  };

  const toggleRead = async (id, read) => {
    const endpoint = read ? "/notifications/unread" : "/notifications/read";
    await api.post(endpoint, { ids: [id] });
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: !read, readAt: !read ? new Date().toISOString() : null } : n));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold">Notifications</h2>
        <div className="flex items-center gap-2">
          <select value={only} onChange={e=>setOnly(e.target.value)} className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm">
            <option value="all">Toutes</option>
            <option value="unread">Non lues</option>
          </select>
          <button onClick={markAllRead} className="rounded border border-neutral-700 px-3 py-1 text-sm hover:bg-neutral-800">Tout marquer lu</button>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-800">
        {items.length === 0 && (
          <div className="p-6 text-neutral-400">{busy ? "Chargement…" : "Aucune notification."}</div>
        )}
        {items.map(n => (
          <NotificationItem key={n.id} n={n} onToggleRead={() => toggleRead(n.id, n.read)} />
        ))}
      </div>

    </div>
  );
}
