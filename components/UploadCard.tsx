"use client";

import { useEffect, useRef, useState } from "react";
import {
  UploadCloud,
  FileText,
  ArrowRight,
  Ruler,
  QrCode,
  CreditCard,
  Copy,
  Download,
  Loader2,
  Eye,
  X,
  ZoomIn,
  Minus,
  Plus,
} from "lucide-react";
import { Card } from "@/components/ui";
import { AcaoPill } from "@/components/AcaoTile";
import { IDIOMAS } from "@/lib/idiomas";
import { CardPaymentBrick, type CardFormData } from "@/components/CardPaymentBrick";

type ResultadoPdf = {
  tipo: "pdf";
  job_id: string;
  paginas_total: number;
  preco_centavos: number;
  preco_por_pagina_centavos: number;
  imagem_original_base64: string;
  imagem_traduzida_base64: string;
  pdf_traduzido_base64: string;
};

type ResultadoDocx = {
  tipo: "docx";
  job_id: string;
  paginas_total: number;
  preco_centavos: number;
  preco_por_pagina_centavos: number;
  texto_original: string[];
  texto_traduzido: string[];
  paragrafos_restantes: number;
};

type Resultado = ResultadoPdf | ResultadoDocx;

function formatarPreco(centavos: number) {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Mesmo valor de PRECO_MINIMO_CENTAVOS do backend (app.py) — como nenhum
// preço por página fixo (500/450/400/350/300) multiplicado por um número
// inteiro de páginas bate certinho em 1490, esse valor exato só aparece
// quando o piso mínimo foi aplicado.
const PRECO_MINIMO_CENTAVOS = 1490;

type EstadoPreview = "sem_arquivo" | "processando" | "pronto_pra_revelar" | "revelado" | "erro";

export function UploadCard() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [origem, setOrigem] = useState("pt");
  const [destino, setDestino] = useState("en");
  const [converterUnidades, setConverterUnidades] = useState(false);
  const [estado, setEstado] = useState<EstadoPreview>("sem_arquivo");
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  // Token da requisição em curso — evita que uma resposta antiga (ex: idioma
  // trocado rápido demais) sobrescreva um resultado mais novo.
  const pedidoAtualRef = useRef(0);

  // Dispara a prévia da 1ª página sozinha, sem precisar clicar em nada — só
  // aparece um botão pra revelar quando estiver pronta. Chamado direto pelos
  // handlers de evento (upload, troca de idioma), nunca num efeito.
  async function buscarPreview(arquivoAtual: File, origemAtual: string, destinoAtual: string) {
    const meuPedido = ++pedidoAtualRef.current;
    setEstado("processando");
    setMensagem(null);
    setResultado(null);

    try {
      const formData = new FormData();
      formData.append("arquivo", arquivoAtual);
      formData.append("idioma_origem", IDIOMAS.find((i) => i.codigo === origemAtual)?.nome ?? origemAtual);
      formData.append("idioma_destino", IDIOMAS.find((i) => i.codigo === destinoAtual)?.nome ?? destinoAtual);
      formData.append("converter_unidades", String(converterUnidades));

      const resp = await fetch("/api/preview", { method: "POST", body: formData });
      const data = await resp.json();
      if (pedidoAtualRef.current !== meuPedido) return;

      if (!resp.ok) {
        setMensagem(data.erro ?? data.detail ?? "Não deu pra processar esse arquivo. Tenta de novo.");
        setEstado("erro");
      } else {
        setResultado(data);
        setEstado("pronto_pra_revelar");
      }
    } catch {
      if (pedidoAtualRef.current === meuPedido) {
        setMensagem("Erro de conexão com o servidor. Tenta de novo em instantes.");
        setEstado("erro");
      }
    }
  }

  function escolherArquivo(f: File | null) {
    if (!f) return;
    const extensao = f.name.split(".").pop()?.toLowerCase();
    if (extensao !== "pdf" && extensao !== "docx") {
      setMensagem("Por enquanto só aceitamos arquivos .pdf ou .docx.");
      return;
    }
    setMensagem(null);
    setArquivo(f);
    buscarPreview(f, origem, destino);
  }

  function trocarOrigem(codigo: string) {
    setOrigem(codigo);
    if (arquivo) buscarPreview(arquivo, codigo, destino);
  }

  function trocarDestino(codigo: string) {
    setDestino(codigo);
    if (arquivo) buscarPreview(arquivo, origem, codigo);
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
            onChange={(e) => trocarOrigem(e.target.value)}
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
            onChange={(e) => trocarDestino(e.target.value)}
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

      {estado === "processando" && (
        <p className="flex items-center justify-center gap-2 text-sm text-[var(--text-secondary)]">
          <Loader2 className="h-4 w-4 animate-spin" /> Traduzindo a 1ª página...
        </p>
      )}

      {estado === "erro" && mensagem && <p className="text-center text-sm text-[var(--text-secondary)]">{mensagem}</p>}

      {estado === "pronto_pra_revelar" && (
        <div className="flex justify-center">
          <button onClick={() => setEstado("revelado")} className="group w-full sm:w-auto">
            <AcaoPill
              cor="azul"
              label="Ver prévia da primeira página"
              icon={<Eye className="h-4 w-4" />}
              className="w-full justify-center sm:w-auto"
            />
          </button>
        </div>
      )}

      {estado === "revelado" && resultado && <ResultadoPreview resultado={resultado} />}
    </Card>
  );
}

function ResultadoPreview({ resultado }: { resultado: Resultado }) {
  const [lightbox, setLightbox] = useState(false);

  function baixarPdfExemplo() {
    if (resultado.tipo !== "pdf") return;
    const link = document.createElement("a");
    link.href = `data:application/pdf;base64,${resultado.pdf_traduzido_base64}`;
    link.download = "previa-traduzida.pdf";
    link.click();
  }

  return (
    <div className="space-y-5 border-t border-[var(--border)] pt-6">
      {resultado.tipo === "pdf" ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setLightbox(true)}
              className="group relative"
              aria-label="Ampliar comparação"
            >
              <p className="mb-2 text-center text-xs font-medium text-[var(--text-muted)]">Original</p>
              <img
                src={`data:image/png;base64,${resultado.imagem_original_base64}`}
                alt="Página original"
                className="w-full rounded-xl border border-[var(--border)] transition group-hover:opacity-80"
              />
              <ZoomIn className="pointer-events-none absolute right-2 top-9 h-6 w-6 rounded-md bg-black/60 p-1 text-white opacity-80 transition group-hover:opacity-100" />
            </button>
            <button
              type="button"
              onClick={() => setLightbox(true)}
              className="group relative"
              aria-label="Ampliar comparação"
            >
              <p className="mb-2 text-center text-xs font-medium text-[var(--text-muted)]">Traduzido</p>
              <img
                src={`data:image/png;base64,${resultado.imagem_traduzida_base64}`}
                alt="Página traduzida"
                className="w-full rounded-xl border border-[var(--border)] transition group-hover:opacity-80"
              />
              <ZoomIn className="pointer-events-none absolute right-2 top-9 h-6 w-6 rounded-md bg-black/60 p-1 text-white opacity-80 transition group-hover:opacity-100" />
            </button>
          </div>
          <p className="text-center text-xs text-[var(--text-muted)]">Clique em qualquer uma das imagens pra ampliar</p>

          <div className="flex justify-center">
            <button onClick={baixarPdfExemplo} className="flex items-center gap-1.5 text-xs font-medium text-sky-400 hover:text-sky-300">
              <Download className="h-3.5 w-3.5" /> Baixar essa página em PDF (texto editável, não imagem)
            </button>
          </div>

          {lightbox && (
            <Lightbox
              imagemOriginal={`data:image/png;base64,${resultado.imagem_original_base64}`}
              imagemTraduzida={`data:image/png;base64,${resultado.imagem_traduzida_base64}`}
              onClose={() => setLightbox(false)}
            />
          )}
        </>
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

      <div className="space-y-5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            Documento completo: <strong className="text-[var(--text-primary)]">{resultado.paginas_total} página(s)</strong>
          </p>
          <p className="text-2xl font-bold text-sky-400">{formatarPreco(resultado.preco_centavos)}</p>
          {resultado.preco_centavos === PRECO_MINIMO_CENTAVOS ? (
            <p className="text-xs font-medium text-[var(--text-muted)]">
              {formatarPreco(PRECO_MINIMO_CENTAVOS)} é o valor mínimo — vale pra documentos de até{" "}
              {Math.ceil(PRECO_MINIMO_CENTAVOS / resultado.preco_por_pagina_centavos) - 1} página(s); a partir daí o
              preço passa a ser calculado por página.
            </p>
          ) : (
            resultado.preco_por_pagina_centavos < 500 && (
              <p className="text-xs font-medium text-emerald-400">
                Desconto de volume aplicado: {formatarPreco(resultado.preco_por_pagina_centavos)}/página
              </p>
            )
          )}
        </div>

        <Checkout jobId={resultado.job_id} valorCentavos={resultado.preco_centavos} />
      </div>
    </div>
  );
}

const ZOOM_MIN = 1;
const ZOOM_MAX = 5;
const ZOOM_PASSO = 0.5;

// Zoom via CSS width (não transform), pra crescer o tamanho real do conteúdo
// dentro do container com overflow-auto — assim o scroll/arrastar pra navegar
// funciona em qualquer navegador, sem precisar de canvas ou lib externa.
function useArrastarPraRolar<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const arrastando = useRef(false);
  const inicio = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  function aoPressionar(e: React.MouseEvent) {
    if (!ref.current) return;
    arrastando.current = true;
    inicio.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: ref.current.scrollLeft,
      scrollTop: ref.current.scrollTop,
    };
  }
  function aoMover(e: React.MouseEvent) {
    if (!arrastando.current || !ref.current) return;
    ref.current.scrollLeft = inicio.current.scrollLeft - (e.clientX - inicio.current.x);
    ref.current.scrollTop = inicio.current.scrollTop - (e.clientY - inicio.current.y);
  }
  function aoSoltar() {
    arrastando.current = false;
  }

  return { ref, aoPressionar, aoMover, aoSoltar };
}

function PainelZoom({ src, alt, zoom }: { src: string; alt: string; zoom: number }) {
  const { ref, aoPressionar, aoMover, aoSoltar } = useArrastarPraRolar<HTMLDivElement>();
  return (
    <div
      ref={ref}
      onMouseDown={aoPressionar}
      onMouseMove={aoMover}
      onMouseUp={aoSoltar}
      onMouseLeave={aoSoltar}
      className={`max-h-[75vh] overflow-auto rounded-xl bg-zinc-900 ${zoom > 1 ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      <img src={src} alt={alt} draggable={false} style={{ width: `${zoom * 100}%`, maxWidth: "none" }} />
    </div>
  );
}

function Lightbox({
  imagemOriginal,
  imagemTraduzida,
  onClose,
}: {
  imagemOriginal: string;
  imagemTraduzida: string;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [onClose]);

  function aumentarZoom() {
    setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_PASSO));
  }
  function diminuirZoom() {
    setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_PASSO));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="relative w-full max-w-6xl" onClick={(e) => e.stopPropagation()}>
        <div className="absolute -top-12 right-0 flex items-center gap-2">
          <button
            onClick={diminuirZoom}
            disabled={zoom <= ZOOM_MIN}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-40"
            aria-label="Diminuir zoom"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-12 text-center text-xs font-medium text-white/80">{Math.round(zoom * 100)}%</span>
          <button
            onClick={aumentarZoom}
            disabled={zoom >= ZOOM_MAX}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-40"
            aria-label="Aumentar zoom"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-center text-xs font-medium text-zinc-400">Original</p>
            <PainelZoom src={imagemOriginal} alt="Página original ampliada" zoom={zoom} />
          </div>
          <div>
            <p className="mb-2 text-center text-xs font-medium text-zinc-400">Traduzido</p>
            <PainelZoom src={imagemTraduzida} alt="Página traduzida ampliada" zoom={zoom} />
          </div>
        </div>
        {zoom > 1 && (
          <p className="mt-2 text-center text-xs text-white/50">Clique e arraste a imagem pra navegar</p>
        )}
      </div>
    </div>
  );
}

type EtapaCheckout = "escolha" | "aguardando" | "pronto" | "erro";

function Checkout({ jobId, valorCentavos }: { jobId: string; valorCentavos: number }) {
  const [etapa, setEtapa] = useState<EtapaCheckout>("escolha");
  const [processandoPix, setProcessandoPix] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pix, setPix] = useState<{ qrCode: string; qrCodeBase64: string } | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [mostrarCartao, setMostrarCartao] = useState(false);

  useEffect(() => {
    if (etapa !== "aguardando") return;
    const intervalo = setInterval(async () => {
      try {
        const resp = await fetch(`/api/jobs/${jobId}`);
        const data = await resp.json();
        if (data.status === "pronto") {
          setDownloadUrl(data.download_url);
          setEtapa("pronto");
          clearInterval(intervalo);
        } else if (data.status === "erro") {
          setErro(data.erro_mensagem ?? "Deu erro ao processar o documento. Fala com a gente.");
          setEtapa("erro");
          clearInterval(intervalo);
        }
      } catch {
        // rede instável — tenta de novo no próximo tick, sem derrubar o polling
      }
    }, 4000);
    return () => clearInterval(intervalo);
  }, [etapa, jobId]);

  // Sem formulário: o Pix só precisa do job_id (o backend gera um e-mail
  // sintético) e o cartão usa o Brick da própria Mercado Pago, que já pede
  // os dados dele (CPF, nome, e-mail) sozinho — nada digitado duas vezes.
  async function pagarComPix() {
    setProcessandoPix(true);
    setErro(null);
    try {
      const resp = await fetch("/api/pagamento/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.erro ?? "Não deu pra gerar o Pix.");
      setPix({ qrCode: data.qr_code, qrCodeBase64: data.qr_code_base64 });
      setEtapa("aguardando");
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setProcessandoPix(false);
    }
  }

  async function pagarComCartao(dados: CardFormData) {
    const resp = await fetch("/api/pagamento/cartao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        job_id: jobId,
        token: dados.token,
        installments: dados.installments,
        payment_method_id: dados.payment_method_id,
        issuer_id: dados.issuer_id,
        email: dados.payer.email,
        cpf: dados.payer.identification.number,
      }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.erro ?? "Não deu pra processar o cartão.");

    if (data.status === "approved" || data.status === "in_process") {
      setEtapa("aguardando");
    } else {
      throw new Error("Pagamento recusado pelo cartão. Tenta outro cartão ou pelo Pix.");
    }
  }

  function copiarCodigoPix() {
    if (!pix) return;
    navigator.clipboard.writeText(pix.qrCode).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  if (etapa === "pronto") {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-sm font-medium text-emerald-400">Pagamento confirmado — seu documento está pronto!</p>
        {downloadUrl ? (
          <a href={downloadUrl} target="_blank" rel="noreferrer">
            <AcaoPill cor="esmeralda" label="Baixar documento traduzido" icon={<Download className="h-4 w-4" />} />
          </a>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">Gerando o link de download...</p>
        )}
      </div>
    );
  }

  if (etapa === "aguardando") {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        {pix ? (
          <>
            <p className="text-sm text-[var(--text-secondary)]">Escaneie o QR Code ou copie o código Pix:</p>
            <img
              src={`data:image/png;base64,${pix.qrCodeBase64}`}
              alt="QR Code Pix"
              className="h-48 w-48 rounded-xl border border-[var(--border)] bg-white p-2"
            />
            <button
              onClick={copiarCodigoPix}
              className="flex items-center gap-1.5 text-xs font-medium text-sky-400 hover:text-sky-300"
            >
              <Copy className="h-3.5 w-3.5" /> {copiado ? "Copiado!" : "Copiar código Pix"}
            </button>
          </>
        ) : (
          <p className="text-sm text-[var(--text-secondary)]">Confirmando seu pagamento no cartão...</p>
        )}
        <p className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Assim que o pagamento é aprovado, o documento é processado
          automaticamente — isso pode levar alguns minutos em documentos grandes.
        </p>
      </div>
    );
  }

  if (etapa === "erro") {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-sm font-medium text-red-400">{erro}</p>
        <button onClick={() => setEtapa("escolha")} className="text-xs font-medium text-sky-400 hover:text-sky-300">
          Tentar de novo
        </button>
      </div>
    );
  }

  if (mostrarCartao) {
    return (
      <div className="space-y-2">
        <p className="text-center text-xs text-[var(--text-muted)]">Até 12x sem juros</p>
        <CardPaymentBrick valorCentavos={valorCentavos} onPagar={pagarComCartao} />
        {erro && <p className="text-center text-sm text-red-400">{erro}</p>}
        <button
          onClick={() => setMostrarCartao(false)}
          className="block text-center text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        >
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
      <button onClick={pagarComPix} disabled={processandoPix} className="group w-full sm:w-auto">
        <AcaoPill
          cor="violeta"
          label={processandoPix ? "Gerando Pix..." : "Pagar com Pix"}
          icon={<QrCode className="h-4 w-4" />}
          pressionado={processandoPix}
          className="w-full justify-center sm:w-auto"
        />
      </button>
      <button onClick={() => setMostrarCartao(true)} className="group w-full sm:w-auto">
        <AcaoPill
          cor="azul"
          label="Pagar com cartão (até 12x)"
          icon={<CreditCard className="h-4 w-4" />}
          className="w-full justify-center sm:w-auto"
        />
      </button>
      {erro && <p className="w-full text-center text-sm text-red-400">{erro}</p>}
    </div>
  );
}
