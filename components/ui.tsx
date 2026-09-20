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
  Grátis: "bg-[var(--accent-success-bg)] text-[var(--accent-success)] border-[var(--accent-success-border)]",
  Pago: "bg-[var(--accent-info-bg)] text-[var(--accent-info)] border-[var(--accent-info-border)]",
  Processando: "bg-[var(--accent-warning-bg)] text-[var(--accent-warning)] border-[var(--accent-warning-border)]",
  Pronto: "bg-[var(--accent-success-bg)] text-[var(--accent-success)] border-[var(--accent-success-border)]",
  Erro: "bg-[var(--accent-danger-bg)] text-[var(--accent-danger)] border-[var(--accent-danger-border)]",
};

export function Badge({ children }: { children: string }) {
  const style = BADGE_STYLES[children] ?? "bg-zinc-500/15 text-[var(--text-secondary)] border-zinc-500/30";
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${style}`}>
      {children}
    </span>
  );
}
