// HamburgerButton.jsx
import React from "react";

export default function HamburgerButton({ onClick, className = "", label = "Ouvrir le menu" }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={[
        "inline-flex flex-col items-center justify-center w-10 h-10 rounded-lg",
        "ring-1 ring-neutral-700 bg-neutral-900/70 hover:bg-neutral-800/70",
        "transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-600/50",
        "group", // Pour les animations de hover
        className,
      ].join(" ")}
    >
      {/* Barre du haut */}
      <span className="block w-5 h-0.5 bg-neutral-200 transition-all duration-200 group-hover:bg-white mb-1.5" />
      {/* Barre du milieu */}
      <span className="block w-5 h-0.5 bg-neutral-200 transition-all duration-200 group-hover:bg-white mb-1.5" />
      {/* Barre du bas */}
      <span className="block w-5 h-0.5 bg-neutral-200 transition-all duration-200 group-hover:bg-white" />
    </button>
  );
}