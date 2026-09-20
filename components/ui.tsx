import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5 shadow-[0_0_20px_rgba(56,189,248,0.08)] backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}

export function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <p className="text-sm text-[var(--text-secondary)]">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">{value}</p>
      {hint && <p className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p>}
    </Card>
  );
}

const BADGE_STYLES: Record<string, string> = {
  Grátis: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Pago: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  Processando: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Pronto: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Erro: "bg-red-500/15 text-red-400 border-red-500/30",
};

export function Badge({ children }: { children: string }) {
  const style = BADGE_STYLES[children] ?? "bg-zinc-500/15 text-[var(--text-secondary)] border-zinc-500/30";
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${style}`}>
      {children}
    </span>
  );
}
