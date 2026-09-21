export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)] px-4 py-6 text-center text-xs text-[#1D222B] sm:px-6">
      <p>
        Tradutor.{" "}
        <a
          href="https://github.com/iaprodutividade/tradutor-web"
          target="_blank"
          rel="noreferrer"
          className="underline decoration-dotted underline-offset-2 hover:text-[var(--text-secondary)]"
        >
          código-fonte
        </a>{" "}
        disponível sob licença AGPL-3.0.
      </p>
    </footer>
  );
}
