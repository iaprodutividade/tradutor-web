import Image from "next/image";
import { FileText, Eye, QrCode, ShieldCheck, Ruler } from "lucide-react";
import { Card, Badge } from "@/components/ui";
import { AcaoTile, AcaoPill } from "@/components/AcaoTile";
import { UploadCard } from "@/components/UploadCard";

const PASSOS = [
  {
    icon: <FileText className="h-6 w-6" />,
    cor: "azul" as const,
    titulo: "1. Envie o arquivo",
    texto: "PDF ou DOCX, sem cadastro e sem e-mail. Escolha o idioma de destino.",
  },
  {
    icon: <Eye className="h-6 w-6" />,
    cor: "esmeralda" as const,
    titulo: "2. Veja a 1ª página grátis",
    texto: "Comparação lado a lado, original e traduzido, pra você conferir a fidelidade antes de pagar.",
  },
  {
    icon: <QrCode className="h-6 w-6" />,
    cor: "violeta" as const,
    titulo: "3. Pague só se aprovar",
    texto: "Pix único, liberação automática do documento completo assim que o pagamento é confirmado.",
  },
];

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      {/* Hero */}
      <section className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <Badge>Novo</Badge>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl">
            Traduza PDF e DOCX <span className="text-sky-400">sem perder o layout</span>
          </h1>
          <p className="mt-4 text-lg text-[var(--text-secondary)]">
            Fichas técnicas, fichas de segurança, rótulos e contratos ficam com a mesma posição de
            texto, a mesma fonte e as mesmas imagens. Só o idioma muda.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a href="#traduzir" className="group">
              <AcaoPill cor="azul" label="Traduzir meu documento" icon={<FileText className="h-4 w-4" />} className="text-base" />
            </a>
            <span className="text-sm text-[var(--text-muted)]">1ª página sempre grátis</span>
          </div>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-3xl border border-[var(--border)] shadow-[0_0_40px_rgba(56,189,248,0.12)]">
            <Image
              src="/images/hero-tradutor.png"
              alt="Documentos PDF e DOCX sendo traduzidos, preservando o layout original"
              width={1376}
              height={768}
              priority
              className="h-auto w-full"
            />
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="mt-24">
        <h2 className="text-center text-2xl font-bold text-[var(--text-primary)]">Como funciona</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {PASSOS.map((p) => (
            <Card key={p.titulo} className="flex flex-col items-center gap-4 text-center">
              <AcaoTile icon={p.icon} label="" cor={p.cor} />
              <div>
                <h3 className="font-semibold text-[var(--text-primary)]">{p.titulo}</h3>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{p.texto}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Upload */}
      <section id="traduzir" className="mt-24 scroll-mt-20">
        <h2 className="text-center text-2xl font-bold text-[var(--text-primary)]">Traduzir agora</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-[var(--text-secondary)]">
          Envie o arquivo pra ver a primeira página traduzida na hora, sem custo.
        </p>
        <div className="mx-auto mt-8 max-w-2xl">
          <UploadCard />
        </div>
      </section>

      {/* Preço + confiança */}
      <section className="mt-24 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="order-2 lg:order-1">
          <Card>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Preço simples, sem surpresa</h2>
            <div className="mt-5 flex items-baseline gap-2">
              <span className="text-4xl font-bold text-sky-400">R$5</span>
              <span className="text-sm text-[var(--text-secondary)]">por página</span>
            </div>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Cobrança mínima de R$14,90 por documento.</p>

            <ul className="mt-6 space-y-3 text-sm text-[var(--text-secondary)]">
              <li className="flex items-start gap-2">
                <Eye className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                1ª página traduzida grátis, sem e-mail, pra você conferir antes de pagar
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
                Números, códigos e unidades regulatórias nunca são alterados
              </li>
              <li className="flex items-start gap-2">
                <Ruler className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                Conversão de unidade de medida opcional, com o original sempre visível ao lado da conversão
              </li>
              <li className="flex items-start gap-2">
                <QrCode className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                Pagamento único via Pix, liberação automática do arquivo completo
              </li>
            </ul>

            <a href="#traduzir" className="group mt-7 inline-block">
              <AcaoPill cor="azul" label="Começar agora" icon={<FileText className="h-4 w-4" />} />
            </a>
          </Card>
        </div>

        <div className="order-1 flex justify-center lg:order-2">
          <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-[var(--border)] shadow-[0_0_40px_rgba(56,189,248,0.1)]">
            <Image
              src="/images/unlock-tradutor.png"
              alt="Documento traduzido liberado após o pagamento"
              width={1200}
              height={896}
              className="h-auto w-full"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
