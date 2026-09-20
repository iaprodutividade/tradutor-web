import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AmbientGlow } from "@/components/ambient-glow";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

// Se a pessoa já escolheu um tema antes, respeita a escolha salva. Na
// primeira visita (nada salvo ainda), respeita a preferência do sistema
// operacional/navegador dela em vez de forçar um padrão único.
const SCRIPT_TEMA_INICIAL = `
try {
  var t = localStorage.getItem("tradutor-theme");
  if (!t) {
    var prefereClaro = window.matchMedia("(prefers-color-scheme: light)").matches;
    t = prefereClaro ? "claro" : "escuro";
  }
  if (t === "intermediario" || t === "claro") {
    document.documentElement.setAttribute("data-theme", t);
  }
} catch (e) {}
`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tradutor — traduza PDF e DOCX mantendo o layout",
  description:
    "Traduza fichas técnicas, rótulos e documentos em PDF ou DOCX para outros idiomas mantendo exatamente o mesmo visual do original.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA_INICIAL }} />
      </head>
      <body suppressHydrationWarning className="flex min-h-full flex-col bg-[var(--bg-page)] text-[var(--text-primary)]">
        <ThemeProvider>
          <AmbientGlow />
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
