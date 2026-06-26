"use client";

import { useCallback, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

function getSnapshot(): Theme {
  if (typeof window === "undefined") return "light";
  return (localStorage.getItem("theme") as Theme) ?? "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

function subscribe(callback: () => void) {
  const handler = (e: StorageEvent) => {
    if (e.key === "theme") callback();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((t: Theme) => {
    localStorage.setItem("theme", t);
    applyTheme(t);
    window.dispatchEvent(new StorageEvent("storage", { key: "theme", newValue: t }));
  }, []);

  const toggle = useCallback(() => {
    const next = getSnapshot() === "light" ? "dark" : "light";
    setTheme(next);
  }, [setTheme]);

  return { theme, setTheme, toggle };
}
