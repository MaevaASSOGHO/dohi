import React, { useEffect, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import "./App.css";
import ToggleKebab from "./components/ToggleKebab";
import { api } from "./lib/api"; // ⬅️ pour le logout API

function useAuthReactive() {
  // lit le token et réagit à l'event personnalisé "auth:changed" et aux changements d'onglet
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


/** Icônes SVG minimalistes (pas de dépendances) */
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
const IconSettings = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M19.4 15a1 1 0 0 1 .2 1.1l-1 1.8a1 1 0 0 1-1.1.5l-1.9-.5a7.2 7.2 0 0 1-1.2.7l-.3 2a1 1 0 0 1-1 .9h-2a1 1 0 0 1-1-.9l-.3-2a7.2 7.2 0 0 1-1.2-.7l-1.9.5a1 1 0 0 1-1.1-.5l-1-1.8a1 1 0 0 1 .2-1.1l1.6-1.4a6.8 6.8 0 0 1 0-1.4L4.6 10a1 1 0 0 1-.2-1.1l1-1.8a1 1 0 0 1 1.1-.5l1.9.5c.4-.3.8-.5 1.2-.7l.3-2a1 1 0 0 1 1-.9h2a1 1 0 0 1 1 .9l.3 2c.4.2.8.4 1.2.7l1.9-.5a1 1 0 0 1 1.1.5l1 1.8a1 1 0 0 1-.2 1.1l-1.6 1.4c.1.5.1.9 0 1.4L19.4 15Z" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);
const IconLogin = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path d="M12 3h6a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-6" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M15 12H4m0 0 3-3m-3 3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function App() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isAuthenticated = useAuthReactive();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const nav = [
    { to: "/discover", label: "Découvrir", icon: IconDiscover },
    { to: "/feed", label: "Fil d’actualité", icon: IconFeed },
    { to: "/notifications/Notifications", label: "Notifications", icon: IconBell },
    { to: "/reports/new", label: "Nouveau signalement", icon: IconReport },
    // { to: "/settings/settings", label: "Paramètres", icon: IconSettings },
  ];

  const CONTENT_MAX_W = "max-w-[1200px]";

  async function handleLogout() {
    try { await api.post("/logout"); } catch { /* OK si non implémenté côté API */ }
    try { localStorage.removeItem("token"); } catch {}
    window.dispatchEvent(new Event("auth:changed")); // force MAJ UI
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-dvh bg-black text-neutral-100">
      {/* Topbar logo (inchangé) */}
      <div className="fixed inset-x-0 top-0 z-40 flex justify-center pointer-events-none">
        <Link
          to="/feed"
          className="pointer-events-auto py-3 opacity-95 hover:opacity-100 transition"
          aria-label="Aller au fil d’actualité"
        >
          
          <img
            src="/Dohi-logo2.png"
            alt="OS Scammer"
            className="w-auto sm:h-24"
          />
        </Link>
      </div>

      <div className={`pt-16 ${CONTENT_MAX_W} mx-auto px-4 sm:px-6 md:px-8`}>
        <div className="flex gap-6">
          {/* SIDEBAR */}
          <aside
            className={`sticky top-16 h-[calc(100dvh-4rem)] rounded-xl border border-neutral-800/70 bg-neutral-950/70 backdrop-blur
              transition-all duration-300 ease-out
              ${sidebarOpen ? "w-64" : "w-16"} overflow-hidden`}
            aria-label="Menu latéral"
          >
            {/* Entête sidebar */}
            <div className="flex items-center gap-2 px-3 py-3 border-b border-neutral-800/60">
              <ToggleKebab isOpen={sidebarOpen} onClick={() => setSidebarOpen(v => !v)} />

              {!isAuthenticated ? (
                <Link
                  to="/login"
                  className={`ml-auto inline-flex items-center gap-2 text-sm px-2 py-1 rounded-md ring-1 ring-neutral-700 hover:bg-neutral-800/50 transition ${
                    sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                  }`}
                >
                  <IconLogin />
                  <span>Se connecter</span>
                </Link>
              ) : (
                <button
                  onClick={handleLogout}
                  className={`ml-auto inline-flex items-center gap-2 text-sm px-2 py-1 rounded-md ring-1 ring-neutral-700 hover:bg-neutral-800/50 transition ${
                    sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                  }`}
                >
                  {/* Icône logout */}
                  
                  <span>Se déconnecter</span>
                </button>
              )}
            </div>

            {/* Navigation (inchangée) */}
            <nav id="sidebar-nav" className="py-2">
              <ul className="space-y-1">
                {nav.map((item) => {
                  const Active = pathname === item.to;
                  const Icon = item.icon;
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        className={`group flex items-center gap-3 px-3 py-2 mx-2 rounded-lg transition
                          ${Active ? "bg-neutral-800/70 ring-1 ring-neutral-700" : "hover:bg-neutral-900/60"}`}
                        title={!sidebarOpen ? item.label : undefined}
                      >
                        <Icon className="h-8 w-8 shrink-0" />
                        <span className={`${sidebarOpen ? "block" : "hidden"} text-sm`}>
                          {item.label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          {/* CONTENU */}
          <main className="flex-1 bg-neutral-950/60 backdrop-blur px-4 sm:px-6 md:px-8 py-6 min-h-[60dvh]">
            <div className="outlet-stretcher">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}