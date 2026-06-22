"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    if (theme === "light") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setTheme("light");
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-6 left-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-slate-200/50 bg-white/80 text-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 dark:border-neutral-800/40 dark:bg-zinc-950/80 dark:text-neutral-200"
      aria-label="Toggle theme"
      type="button"
    >
      {theme === "light" ? (
        <Moon className="size-5" />
      ) : (
        <Sun className="size-5 text-amber-400" />
      )}
    </button>
  );
}
