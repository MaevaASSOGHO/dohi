import { useEffect, useState } from "react";

const KEY = "osscammer_theme"; // "dark" | "light"

export function useTheme() {
  const [theme, setTheme] = useState(
    typeof window !== "undefined" ? (localStorage.getItem(KEY) || "dark") : "dark"
  );

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") root.classList.add("theme-light");
    else root.classList.remove("theme-light");
    localStorage.setItem(KEY, theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return { theme, setTheme, toggle };
}
