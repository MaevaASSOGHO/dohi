// src/pages/notifications/NotificationItem.jsx
import { Link } from "react-router-dom";

export default function NotificationItem({ n, onToggleRead }) {
  const created = n.createdAt ? new Date(n.createdAt) : null;
  const readCls = n.read ? "opacity-70" : "opacity-100";
  const bullet  = n.read ? "●" : "⬤";

  const render = () => {
    switch (n.kind) {
      case "report_commented":
        return (
          <>
            <span className="font-medium text-neutral-900 dark:text-neutral-100">Nouveau commentaire</span>
            {" sur "}
            <Link className="underline underline-offset-2 hover:opacity-80" to={`/reports/${n.data?.reportId}`}>votre signalement</Link>
            {n.data?.excerpt ? <> — <span className="text-neutral-600 dark:text-neutral-300">{n.data.excerpt}</span></> : null}
          </>
        );
      case "vote_received":
        return <span className="text-neutral-800 dark:text-neutral-100">Votre signalement a reçu un vote d’utilité 👍</span>;
      case "moderation_update":
        return <>Mise à jour de modération : <span className="uppercase">{n.data?.status}</span></>;
      default:
        return <>{n.kind}</>;
    }
  };

  return (
    <div className={`flex items-start gap-3 border-b p-3
                     border-neutral-200 dark:border-neutral-800 ${readCls}`}>
      <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{bullet}</div>

      <div className="min-w-0 flex-1">
        <div className="text-sm text-neutral-900 dark:text-neutral-100">{render()}</div>
        <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          {created ? created.toLocaleString() : ""}
        </div>
      </div>

      <button
        type="button"
        onClick={onToggleRead}
        className="text-xs rounded border px-2 py-1
                   border-neutral-300 text-neutral-700 hover:bg-neutral-50
                   dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
      >
        {n.read ? "Marquer non lu" : "Marquer lu"}
      </button>
    </div>
  );
}
