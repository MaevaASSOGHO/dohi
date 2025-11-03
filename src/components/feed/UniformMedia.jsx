// components/feed/UniformMedia.jsx
import React from "react";

export default function UniformMedia({
  images = [],
  onClick,
  aspectMobile = "aspect-[4/3]",
  aspectDesktop = "md:aspect-video",
}) {
  const src = images?.[0] || null;

  return (
    <div className={`relative w-full overflow-hidden rounded-2xl bg-neutral-900 ${aspectMobile} ${aspectDesktop}`}>
      {src ? (
        <img
          src={src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover select-none"
          onClick={onClick}
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-neutral-500">
          Aucun média
        </div>
      )}
    </div>
  );
}
