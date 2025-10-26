// src/components/ToggleKebab.jsx
export default function ToggleKebab({ isOpen, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-expanded={isOpen}
      aria-label="Ouvrir/fermer le menu"
      className="h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-neutral-800/60 transition"
    >
      <svg
        viewBox="0 0 24 24"
        className={`h-5 w-5 transition-transform ${isOpen ? "rotate-90" : "rotate-0"}`}
        aria-hidden
      >
        <circle cx="5" cy="12" r="1.6" fill="currentColor" />
        <circle cx="12" cy="12" r="1.6" fill="currentColor" />
        <circle cx="19" cy="12" r="1.6" fill="currentColor" />
      </svg>
    </button>
  );
}
