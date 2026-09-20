"use client";

import { Moon, SunMedium, CircleDot } from "lucide-react";
import { useTheme, type Theme } from "@/components/theme-provider";

const OPCOES: { valor: Theme; label: string; Icon: typeof Moon }[] = [
  { valor: "claro", label: "Tema claro", Icon: SunMedium },
  { valor: "intermediario", label: "Tema intermediário", Icon: CircleDot },
  { valor: "escuro", label: "Tema escuro", Icon: Moon },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-0.5 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-1">
      {OPCOES.map(({ valor, label, Icon }) => {
        const ativo = theme === valor;
        return (
          <button
            key={valor}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={ativo}
            onClick={() => setTheme(valor)}
            className={
              ativo
                ? "flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500 text-zinc-950"
                : "flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
            }
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
