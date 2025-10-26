import { Link } from "react-router-dom";

export default function NotificationItem({ n, onToggleRead }) {
  const created = n.createdAt ? new Date(n.createdAt) : null;
  const readCls = n.read ? "opacity-70" : "opacity-100";
  const bullet  = n.read ? "●" : "⬤";

  // mapping simple d’actions selon kind
  const render = () => {
    switch (n.kind) {
      case "report_commented":
        return (
          <>
            <span className="font-medium">Nouveau commentaire</span>
            {" sur "}
            <Link className="underline" to={`/reports/${n.data?.reportId}`}>votre signalement</Link>
            {n.data?.excerpt ? <> — <span className="text-neutral-300">{n.data.excerpt}</span></> : null}
          </>
        );
      case "vote_received":
        return <>Votre signalement a reçu un vote d’utilité 👍</>;
      case "moderation_update":
        return <>Mise à jour de modération : <span className="uppercase">{n.data?.status}</span></>;
      default:
        return <>{n.kind}</>;
    }
  };

  return (
    <div className={`flex items-start gap-3 border-b border-neutral-800 p-3 ${readCls}`}>
      <div className="mt-1 text-xs">{bullet}</div>
      <div className="min-w-0 flex-1">
        <div className="text-sm">{render()}</div>
        <div className="mt-1 text-xs text-neutral-400">{created ? created.toLocaleString() : ""}</div>
      </div>
      <button onClick={onToggleRead} className="text-xs rounded border border-neutral-700 px-2 py-1 hover:bg-neutral-800">
        {n.read ? "Marquer non lu" : "Marquer lu"}
      </button>
    </div>
  );
}
