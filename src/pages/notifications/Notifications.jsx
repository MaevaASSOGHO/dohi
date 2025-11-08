// src/pages/notifications/NotificationsPage.jsx
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
        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Notifications</h2>
        <div className="flex items-center gap-2">
          <select
            value={only}
            onChange={e=>setOnly(e.target.value)}
            className="rounded border border-neutral-300 dark:border-neutral-700
                       bg-white dark:bg-neutral-900
                       text-neutral-900 dark:text-neutral-100
                       px-2 py-1 text-sm
                       focus:outline-none focus:ring-2 focus:ring-violet-500/40"
          >
            <option value="all">Toutes</option>
            <option value="unread">Non lues</option>
          </select>

          <button
            onClick={markAllRead}
            className="rounded border px-3 py-1 text-sm
                       border-neutral-300 text-neutral-700 hover:bg-neutral-50
                       dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
          >
            Tout marquer lu
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-300 dark:border-neutral-800">
        {items.length === 0 && (
          <div className="p-6 text-neutral-600 dark:text-neutral-400">
            {busy ? "Chargement…" : "Aucune notification."}
          </div>
        )}
        {items.map(n => (
          <NotificationItem key={n.id} n={n} onToggleRead={() => toggleRead(n.id, n.read)} />
        ))}
      </div>
    </div>
  );
}
