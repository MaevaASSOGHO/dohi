import React, { useEffect, useMemo, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import "./App.css";
import HamburgerButton from "./components/HamburgerButton";
import { api, logoutViaApi } from "./lib/api";

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

function useTheme() {
  // 1) Lire préférence (localStorage > système)
  const getInitial = () => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  const [theme, setTheme] = useState(getInitial);

  // 2) Appliquer sur <html> + persister
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  // 3) Toggle
  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return { theme, toggle };
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Basculer en thème clair" : "Basculer en thème sombre"}
      className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm 
                 border border-neutral-300 dark:border-neutral-700
                 bg-white/70 backdrop-blur dark:bg-neutral-900/60
                 hover:bg-white dark:hover:bg-neutral-800
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60
                 transition"
      title={isDark ? "Thème clair" : "Thème sombre"}
    >
      <span className="text-base">{isDark ? "☀️" : "🌙"}</span>
      <span className="hidden sm:inline">{isDark ? "Clair" : "Sombre"}</span>
    </button>
  );
}
export default function App() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isAuthenticated = useAuthReactive();

  /* Sidebar : ouverte par défaut ≥ sm, fermée en mobile + écoute des changements */
  const [isSmall, setIsSmall] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 639px)").matches : false
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
useEffect(() => {
  const mql = window.matchMedia("(max-width: 639px)");
  const onChange = () => {
    setIsSmall(mql.matches);
    // Supprimé le comportement auto : ne change plus l'état sidebarOpen automatiquement
  };
  mql.addEventListener?.("change", onChange);
  return () => mql.removeEventListener?.("change", onChange);
}, []);

  const nav = [
    { to: "/", label: "Accueil", icon: IconFeed },
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
    try {
      await logoutViaApi();
    } catch (e) {
      // on ignore, l'important c'est de nettoyer côté front
    }

    try {
      localStorage.removeItem("token");
    } catch {}

    window.dispatchEvent(new Event("auth:changed"));
    navigate("/login", { replace: true });
  }


  return (
    <div className="min-h-dvh w-full bg-white text-neutral-900 dark:bg-black dark:text-neutral-100">
      {/* HEADER */}
      <header
        className="fixed inset-x-0 top-0 z-50 border-b backdrop-blur
                    bg-violet-900/80 dark:bg-violet-900/80
                    border-violet-200/50 dark:border-neutral-800/50"
        role="banner"
      >
        <div className="mx-auto max-w-[1200px] px-4 h-14 flex items-center justify-between">
          {/* Hamburger dans le header */}
          <div className="flex items-center gap-3">
            <HamburgerButton onClick={() => setSidebarOpen(v => !v)} aria-label="Ouvrir/fermer le menu" />
            
          </div>

          {/* Logo centré (légèrement plus grand) */}
          <div className="flex items-center justify-center h-full overflow-hidden">
            <Link to="/feed" aria-label="Aller à l’accueil" className="block">
              <img
                src="/Dohi-logo2.png"
                alt="OS Scammer"
                className="block h-auto max-h-full w-[110px] sm:w-[140px] object-contain"
              />
            </Link>
          </div>

          <div className="flex items-center gap-3 mr-4 sm:mr-6">
           <ThemeToggle />
          </div>
        </div>
      </header>
      {sidebarOpen && (
        <div
          className="fixed inset-x-0 bottom-0 z-30 bg-white/70 dark:bg-black/40 backdrop-blur pointer-events-none"
          style={{ top: '5rem' }} // ≈ h-20 (80px) pour coller au nouveau header
        />
      )}

      {/* SIDEBAR EN SLIDE-DOWN (depuis le haut, sous le header) */}
      <aside
        className={[
          "fixed left-0 top-0 z-40 w-full",
          "transition-transform duration-300 ease-out origin-top",
          // descend jusque sous le header (≈ 3.5rem mobile, 4rem sm+)
          sidebarOpen ? "translate-y-16 sm:translate-y-20" : "-translate-y-full",
        ].join(" ")}
        aria-label="Menu latéral"
      >
        <div className="mx-auto max-w-[1200px] px-3 sm:px-6 md:px-8">
          <div className="rounded-b-xl border-x border-b backdrop-blur
                          bg-violet-100/90 dark:bg-neutral-950/90
                          border-neutral-200/70 dark:border-neutral-800/70">
            {/* Bandeau top interne (login/logout) */}
            <div className="flex items-center gap-2 px-3 py-3 border-b  border-neutral-200/60 dark:border-neutral-800/60">
              {!isAuthenticated ? (
                <Link
                  to="/login"
                  type="button"
                  className="ml-auto inline-flex items-center gap-2 text-sm px-2 py-1 rounded-md 
                              ring-1 ring-neutral-300 dark:ring-neutral-700
                              hover:bg-neutral-100 dark:hover:bg-neutral-800/50
                              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60
                              transition"
                              aria-label="Se connecter">
                  <IconLogin /><span>Se connecter</span>
                </Link>
              ) : (
                <button
                  type="button" 
                  onClick={handleLogout}
                  className="ml-auto inline-flex items-center gap-2 text-sm px-2 py-1 rounded-md 
                              ring-1 ring-neutral-300 dark:ring-neutral-700
                              hover:bg-neutral-100 dark:hover:bg-neutral-800/50
                              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60
                              transition"
                              aria-label="Se déconnecter"
                >
                  <span>Se déconnecter</span>
                </button>
              )}
            </div>

            {/* Navigation */}
            <nav id="sidebar-nav" className="py-2"role="navigation" aria-label="Navigation principale">
              <ul className="space-y-1">
                {nav.map((item) => {
                  const Active = pathname === item.to;
                  const Icon = item.icon;
                  const classes = [
                    "group flex items-center gap-3 px-3 py-2 mx-2 rounded-lg transition",
                    Active 
                      ? "ring-1 bg-neutral-200/70 ring-neutral-300 dark:bg-neutral-800/70 dark:ring-neutral-700"
                      : "hover:bg-neutral-100 dark:hover:bg-neutral-900/60",
                  ].join(" ");
                  return (
                    <li key={item.to}>
                      {item.external ? (
                        <a href={item.to} target="_blank" rel="noopener noreferrer" className={classes}>
                          <Icon className="h-6 w-6 shrink-0" />
                          <span className="text-sm">{item.label}</span>
                        </a>
                      ) : (
                        <Link to={item.to} className={classes} onClick={() => setSidebarOpen(false)}>
                          <Icon className="h-6 w-6 shrink-0" />
                          <span className="text-sm">{item.label}</span>
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>
      </aside>

      {/* CONTENU (passe sous le header) */}
      <div className={`pt-20 sm:pt-24 ${CONTENT_MAX_W} mx-auto px-3 sm:px-6 md:px-8`}>
        <main className="mx-auto max-w-[1200px] px-4 py-6"role="main" aria-label="Contenu principal">
          <div className="outlet-stretcher min-w-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}