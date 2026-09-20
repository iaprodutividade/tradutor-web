"use client";

import { useRef, useState } from "react";
import { UploadCloud, FileText, ArrowRight, Ruler, QrCode } from "lucide-react";
import { Card } from "@/components/ui";
import { AcaoPill } from "@/components/AcaoTile";
import { IDIOMAS } from "@/lib/idiomas";

type ResultadoPdf = {
  tipo: "pdf";
  paginas_total: number;
  preco_centavos: number;
  imagem_original_base64: string;
  imagem_traduzida_base64: string;
};

type ResultadoDocx = {
  tipo: "docx";
  paginas_total: number;
  preco_centavos: number;
  texto_original: string[];
  texto_traduzido: string[];
  paragrafos_restantes: number;
};

type Resultado = ResultadoPdf | ResultadoDocx;

function formatarPreco(centavos: number) {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function UploadCard() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [origem, setOrigem] = useState("pt");
  const [destino, setDestino] = useState("en");
  const [converterUnidades, setConverterUnidades] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  function escolherArquivo(f: File | null) {
    if (!f) return;
    const extensao = f.name.split(".").pop()?.toLowerCase();
    if (extensao !== "pdf" && extensao !== "docx") {
      setMensagem("Por enquanto só aceitamos arquivos .pdf ou .docx.");
      return;
    }
    setMensagem(null);
    setResultado(null);
    setArquivo(f);
  }

  async function enviar() {
    if (!arquivo) {
      setMensagem("Escolha um arquivo primeiro.");
      return;
    }
    setEnviando(true);
    setMensagem(null);
    setResultado(null);

    try {
      const formData = new FormData();
      formData.append("arquivo", arquivo);
      formData.append("idioma_origem", IDIOMAS.find((i) => i.codigo === origem)?.nome ?? origem);
      formData.append("idioma_destino", IDIOMAS.find((i) => i.codigo === destino)?.nome ?? destino);

      const resp = await fetch("/api/preview", { method: "POST", body: formData });
      const data = await resp.json();

      if (!resp.ok) {
        setMensagem(data.erro ?? data.detail ?? "Não deu pra processar esse arquivo. Tenta de novo.");
      } else {
        setResultado(data);
      }
    } catch {
      setMensagem("Erro de conexão com o servidor. Tenta de novo em instantes.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Card className="space-y-6">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          escolherArquivo(e.dataTransfer.files?.[0] ?? null);
        }}
        onClick={() => inputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-2)] px-6 py-10 text-center transition hover:border-sky-500/50 hover:bg-[var(--surface-3)]"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={(e) => escolherArquivo(e.target.files?.[0] ?? null)}
        />
        {arquivo ? (
          <>
            <FileText className="h-8 w-8 text-sky-400" />
            <p className="text-sm font-medium text-[var(--text-primary)]">{arquivo.name}</p>
            <p className="text-xs text-[var(--text-muted)]">Clique pra trocar o arquivo</p>
          </>
        ) : (
          <>
            <UploadCloud className="h-8 w-8 text-[var(--text-muted)]" />
            <p className="text-sm font-medium text-[var(--text-primary)]">Arraste o arquivo aqui ou clique pra escolher</p>
            <p className="text-xs text-[var(--text-muted)]">PDF ou DOCX</p>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Idioma original</span>
          <select
            value={origem}
            onChange={(e) => setOrigem(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-sky-500/60"
          >
            {IDIOMAS.map((i) => (
              <option key={i.codigo} value={i.codigo}>
                {i.nome}
              </option>
            ))}
          </select>
        </label>

        <ArrowRight className="mt-5 hidden h-4 w-4 shrink-0 text-[var(--text-muted)] sm:block" />

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Traduzir para</span>
          <select
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-sky-500/60"
          >
            {IDIOMAS.map((i) => (
              <option key={i.codigo} value={i.codigo}>
                {i.nome}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
        <input
          type="checkbox"
          checked={converterUnidades}
          onChange={(e) => setConverterUnidades(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-sky-500"
        />
        <span className="text-sm text-[var(--text-secondary)]">
          <span className="flex items-center gap-1.5 font-medium text-[var(--text-primary)]">
            <Ruler className="h-3.5 w-3.5" /> Converter unidades de medida
          </span>
          Mostra a conversão ao lado do valor original (ex: 500 mg, que também aparece como 17,6 oz).
          O número original nunca é alterado. Desligado por padrão. Ainda não afeta a prévia abaixo.
        </span>
      </label>

      <div className="flex flex-col items-center gap-3">
        <button onClick={enviar} disabled={enviando} className="group w-full sm:w-auto">
          <AcaoPill
            cor="azul"
            label={enviando ? "Traduzindo a 1ª página..." : "Ver prévia grátis da 1ª página"}
            icon={<FileText className="h-4 w-4" />}
            pressionado={enviando}
            className="w-full justify-center sm:w-auto"
          />
        </button>
        {mensagem && <p className="text-center text-sm text-[var(--text-secondary)]">{mensagem}</p>}
      </div>

      {resultado && <ResultadoPreview resultado={resultado} />}
    </Card>
  );
}

function ResultadoPreview({ resultado }: { resultado: Resultado }) {
  return (
    <div className="space-y-5 border-t border-[var(--border)] pt-6">
      {resultado.tipo === "pdf" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-center text-xs font-medium text-[var(--text-muted)]">Original</p>
            <img
              src={`data:image/png;base64,${resultado.imagem_original_base64}`}
              alt="Página original"
              className="w-full rounded-xl border border-[var(--border)]"
            />
          </div>
          <div>
            <p className="mb-2 text-center text-xs font-medium text-[var(--text-muted)]">Traduzido</p>
            <img
              src={`data:image/png;base64,${resultado.imagem_traduzida_base64}`}
              alt="Página traduzida"
              className="w-full rounded-xl border border-[var(--border)]"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm text-[var(--text-secondary)]">
            <p className="text-xs font-medium text-[var(--text-muted)]">Original</p>
            {resultado.texto_original.map((t, i) => (
              <p key={i}>{t}</p>
            ))}
          </div>
          <div className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm text-[var(--text-secondary)]">
            <p className="text-xs font-medium text-[var(--text-muted)]">Traduzido</p>
            {resultado.texto_traduzido.map((t, i) => (
              <p key={i}>{t}</p>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-5 text-center">
        <p className="text-sm text-[var(--text-secondary)]">
          Documento completo: <strong className="text-[var(--text-primary)]">{resultado.paginas_total} página(s)</strong>
        </p>
        <p className="text-2xl font-bold text-sky-400">{formatarPreco(resultado.preco_centavos)}</p>
        <p className="text-xs text-[var(--text-muted)]">Pagamento único via Pix — em breve disponível aqui.</p>
        <AcaoPill cor="violeta" label="Pagar com Pix" icon={<QrCode className="h-4 w-4" />} pressionado />
      </div>
    </div>
  );
}
