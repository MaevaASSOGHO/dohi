import React, { useEffect, useMemo, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import "./App.css";
import ToggleKebab from "./components/ToggleKebab";
import { api } from "./lib/api";

/* Auth réactive (token localStorage + events cross-tab) */
function useAuthReactive() {
  const [auth, setAuth] = useState(() => {
    try { return Boolean(localStorage.getItem("token")); } catch { return false; }
  });
  useEffect(() => {
    const update = () => {
      try { setAuth(Boolean(localStorage.getItem("token"))); } catch { setAuth(false); }
    };
    window.addEventListener("storage", update);
    window.addEventListener("auth:changed", update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("auth:changed", update);
    };
  }, []);
  return auth;
}

/** Icônes SVG */
const IconDiscover = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path d="M11 21C6.03 21 2 16.97 2 12S6.03 3 11 3s9 4.03 9 9-4.03 9-9 9Z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="m14.5 9.5-3.2 1.28L10 14l3.2-1.28L14.5 9.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconFeed = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <rect x="3" y="4" width="18" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="3" y="10" width="18" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="3" y="16" width="18" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);
const IconBell = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path d="M15 17H9c-2 0-3-1-3-3v-2a6 6 0 1 1 12 0v2c0 2-1 3-3 3Z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M10 17a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IconReport = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path d="M7 3h7l3 3v15H7V3Z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M10 8h5M10 12h5M10 16h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IconContact = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-5 3V7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 7l-9 6L3 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconSettings = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M19.4 15a1 1 0 0 1 .2 1.1l-1 1.8a1 1 0 0 1-1.1.5l-1.9-.5a7.2 7.2 0 0 1-1.2.7l-.3 2a1 1 0 0 1-1 .9h-2a1 1 0 0 1-1-.9l-.3-2a7.2 7.2 0 0 1-1.2-.7l-1.9.5a1 1 0 0 1-1.1-.5l-1-1.8a1 1 0 0 1 .2-1.1l1.6-1.4c.1.5.1.9 0 1.4L19.4 15Z" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);
const IconLogin = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path d="M12 3h6a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-6" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M15 12H4m0 0 3-3m-3 3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconVerifyId = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <rect x="2.5" y="4.5" width="19" height="15" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="8" cy="9.5" r="1.6" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M5.5 14.2c.8-.9 2.1-1.4 4.5-1.4s3.7.5 4.5 1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <g transform="translate(14,12)">
      <circle cx="4.5" cy="4.5" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M3.2 4.6l1 1 2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </g>
  </svg>
);

export default function App() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isAuthenticated = useAuthReactive();

  /* Sidebar : ouverte par défaut ≥ sm, fermée en mobile + écoute des changements */
  const [isSmall, setIsSmall] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 639px)").matches : false
  );
  const [sidebarOpen, setSidebarOpen] = useState(() => !isSmall);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 639px)");
    const onChange = () => {
      setIsSmall(mql.matches);
      setSidebarOpen(!mql.matches); // auto : ouverte en desktop, fermée en mobile
    };
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, []);

  const nav = [
    { to: "/discover", label: "Découvrir", icon: IconDiscover },
    { to: "/feed", label: "Fil d’actualité", icon: IconFeed },
    { to: "/notifications/Notifications", label: "Notifications", icon: IconBell },
    { to: "/reports/new", label: "Nouveau signalement", icon: IconReport },
    { to: "/kyc", label: "Vérifier mon identité", icon: IconVerifyId },
    { to: "https://dohi-contact.chat-mabelle.com/contact", label: "Contact", icon: IconContact, external: true },
    // { to: "/settings/settings", label: "Paramètres", icon: IconSettings },
  ];

  const CONTENT_MAX_W = "max-w-[1200px]";

  async function handleLogout() {
    try { await api.post("/logout"); } catch {}
    try { localStorage.removeItem("token"); } catch {}
    window.dispatchEvent(new Event("auth:changed"));
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-dvh bg-black text-neutral-100">
      {/* Bouton hamburger mobile */}
      <div className="fixed left-3 top-3 z-50 sm:hidden">
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="inline-flex items-center justify-center rounded-md px-3 py-2 ring-1 ring-neutral-700 bg-neutral-900/70"
          aria-label="Ouvrir le menu"
        >
          <span className="block w-5 h-[2px] bg-neutral-200 mb-[5px]" />
          <span className="block w-5 h-[2px] bg-neutral-200 mb-[5px]" />
          <span className="block w-5 h-[2px] bg-neutral-200" />
        </button>
      </div>

    {/* TOPBAR MEDIUM */}
{/* HEADER qui défile (pas fixe) */}
<header className="w-full flex justify-center">
  <Link
    to="/feed"
    className="py-2 md:py-3 opacity-95 hover:opacity-100 transition"
    aria-label="Aller au fil d’actualité"
  >
    <img
      src="/Dohi-logo2.png"
      alt="OS Scammer"
      className="block w-auto !h-[62px] md:!h-[72px] lg:!h-[72px] xl:!h-[72px] object-contain"
    />
  </Link>
</header>





      {/* Overlay mobile (ferme la sidebar au clic) */}
      {isSmall && sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 sm:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className={`${CONTENT_MAX_W} mx-auto px-3 sm:px-6 md:px-8`}>
  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          {/* SIDEBAR (off-canvas en mobile, sticky en desktop) */}
          <aside
            className={[
              "z-50 sm:z-auto sm:sticky sm:top-16 sm:h-[calc(100dvh-4rem)]",
              "rounded-xl border border-neutral-800/70 bg-neutral-950/70 backdrop-blur",
              "transition-transform duration-300 ease-out overflow-hidden",
              isSmall ? (sidebarOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0",
              "w-64 sm:w-64",
            ].join(" ")}
            aria-label="Menu latéral"
          >
            {/* Entête sidebar */}
            <div className="flex items-center gap-2 px-3 py-3 border-b border-neutral-800/60">
              <ToggleKebab isOpen={sidebarOpen} onClick={() => setSidebarOpen((v) => !v)} />

              {!isAuthenticated ? (
                <Link
                  to="/login"
                  className={[
                    "ml-auto inline-flex items-center gap-2 text-sm px-2 py-1 rounded-md",
                    "ring-1 ring-neutral-700 hover:bg-neutral-800/50 transition",
                    sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none",
                  ].join(" ")}
                >
                  <IconLogin />
                  <span>Se connecter</span>
                </Link>
              ) : (
                <button
                  onClick={handleLogout}
                  className={[
                    "ml-auto inline-flex items-center gap-2 text-sm px-2 py-1 rounded-md",
                    "ring-1 ring-neutral-700 hover:bg-neutral-800/50 transition",
                    sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none",
                  ].join(" ")}
                >
                  <span>Se déconnecter</span>
                </button>
              )}
            </div>

            {/* Navigation */}
            <nav id="sidebar-nav" className="py-2">
              <ul className="space-y-1">
                {nav.map((item) => {
                  const Active = pathname === item.to;
                  const Icon = item.icon;
                  const classes = [
                    "group flex items-center gap-3 px-3 py-2 mx-2 rounded-lg transition",
                    Active ? "bg-neutral-800/70 ring-1 ring-neutral-700" : "hover:bg-neutral-900/60",
                  ].join(" ");
                  return (
                    <li key={item.to}>
                      {item.external ? (
                        <a href={item.to} target="_blank" rel="noopener noreferrer" className={classes}>
                          <Icon className="h-6 w-6 shrink-0" />
                          <span className={`${sidebarOpen ? "block" : "hidden"} text-sm`}>{item.label}</span>
                        </a>
                      ) : (
                        <Link to={item.to} className={classes} title={!sidebarOpen ? item.label : undefined}>
                          <Icon className="h-6 w-6 shrink-0" />
                          <span className={`${sidebarOpen ? "block" : "hidden"} text-sm`}>{item.label}</span>
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          {/* CONTENU */}
          <main className="flex-1 bg-neutral-950/60 backdrop-blur px-3 sm:px-6 md:px-8 py-4 sm:py-6 min-h-[60dvh]">
            <div className="outlet-stretcher min-w-0">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
