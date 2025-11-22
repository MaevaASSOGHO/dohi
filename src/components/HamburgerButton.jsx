// HamburgerButton.jsx
import React from "react";

export default function HamburgerButton({ onClick, className = "", label = "Ouvrir le menu", isOpen = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={[
        "inline-flex flex-col items-center justify-center w-10 h-10 rounded-lg",
        "bg-violet-600 hover:bg-violet-700 transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-violet-900",
        "group", // Pour les animations de hover
        className,
      ].join(" ")}
    >
      {/* Barre du haut avec animation */}
      <span className={`block w-5 h-0.5 bg-white transition-all duration-200 mb-1.5 ${
        isOpen ? "rotate-45 translate-y-2" : ""
      }`} />
      {/* Barre du milieu avec animation */}
      <span className={`block w-5 h-0.5 bg-white transition-all duration-200 mb-1.5 ${
        isOpen ? "opacity-0" : "opacity-100"
      }`} />
      {/* Barre du bas avec animation */}
      <span className={`block w-5 h-0.5 bg-white transition-all duration-200 ${
        isOpen ? "-rotate-45 -translate-y-2" : ""
      }`} />
    </button>
  );
}