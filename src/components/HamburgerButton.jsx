import React from "react";

export default function HamburgerButton({ onClick, className = "", label = "Ouvrir le menu" }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={[
        "inline-flex items-center justify-center rounded-md px-3 py-2",
        "ring-1 ring-neutral-700 bg-neutral-900/70 hover:bg-neutral-800/70",
        "transition focus:outline-none focus:ring-2 focus:ring-violet-600/50",
        className,
      ].join(" ")}
    >
      <span className="block w-5 h-[2px] bg-neutral-200 mb-[5px]" />
      <span className="block w-5 h-[2px] bg-neutral-200 mb-[5px]" />
      <span className="block w-5 h-[2px] bg-neutral-200" />
    </button>
  );
}
