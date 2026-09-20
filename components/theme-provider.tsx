"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "escuro" | "intermediario" | "claro";

const STORAGE_KEY = "tradutor-theme";

const ThemeContext = createContext<{ theme: Theme; setTheme: (t: Theme) => void } | null>(null);

function aplicarNoDocumento(theme: Theme) {
  if (theme === "escuro") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("escuro");

  useEffect(() => {
    const atual = document.documentElement.getAttribute("data-theme");
    if (atual === "intermediario" || atual === "claro") setThemeState(atual);
  }, []);

  function setTheme(novo: Theme) {
    setThemeState(novo);
    localStorage.setItem(STORAGE_KEY, novo);
    aplicarNoDocumento(novo);
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme precisa estar dentro de <ThemeProvider>");
  return ctx;
}
