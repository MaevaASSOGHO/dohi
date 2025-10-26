// src/components/Page.jsx
export default function Page({
  title,
  children,
  surface = true,       // false => page "plein fond", sans carte
  className = "",
  headerRight = null,   // zone actions à droite du titre
}) {
  return (
    <section className="flex-1 flex flex-col min-h-full">
      <div
        className={[
          surface
            ? "rounded-2xl border border-neutral-800 bg-neutral-950/60 backdrop-blur"
            : "",
          "flex-1 flex flex-col min-h-full",
          className,
        ].join(" ")}
      >
        {(title || headerRight) && (
          <header className="flex items-center justify-between px-4 sm:px-6 md:px-8 py-4 border-b border-neutral-800/60">
            {title ? <h1 className="text-lg font-semibold">{title}</h1> : <span />}
            {headerRight}
          </header>
        )}
        <div className="flex-1 flex flex-col px-4 sm:px-6 md:px-8 py-6 min-h-0">
          {children}
        </div>
      </div>
    </section>
  );
}
