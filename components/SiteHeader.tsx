import Link from "next/link";
import { Languages } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--bg-page)]/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/20 to-transparent ring-1 ring-inset ring-sky-500/20">
            <Languages className="h-4.5 w-4.5 text-[var(--accent-info)]" />
          </span>
          <span className="text-base font-bold text-[var(--text-primary)]">Tradutor</span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
