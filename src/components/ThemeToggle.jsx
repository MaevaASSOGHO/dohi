import { useTheme } from "../hooks/useTheme";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button className="btn" onClick={toggle} title="Basculer thème">
      {theme === "dark" ? "🌙 Sombre" : "☀️ Clair"}
    </button>
  );
}
