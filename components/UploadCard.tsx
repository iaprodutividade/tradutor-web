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
  ShieldCheck,
  Tag,
  Check,
  Link2,
  Mail,
  Send,
  ImageOff,
  BrainCircuit,
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
  imagem_original_base64: string;
  imagem_traduzida_base64: string;
};

type ResultadoPdfSemTexto = {
  tipo: "pdf_sem_texto";
  job_id: string;
  paginas_total: number;
  imagem_original_base64: string;
};

type Resultado = ResultadoPdf | ResultadoDocx | ResultadoPdfSemTexto;

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

  // Recuperação de tradução: sem isso, um F5 na tela de pagamento/progresso
  // perdia o acesso pra sempre (o job_id só existia na memória da página) —
  // o arquivo ficava pronto no Storage, mas ninguém sabia onde pegar. Agora
  // o job_id vai pra URL (?job=) assim que o Checkout é criado, e também
  // fica salvo no navegador como último job, pra oferecer retomar mesmo sem
  // o link exato.
  const [jobParaRecuperar, setJobParaRecuperar] = useState<string | null>(null);
  const [ultimoJobSalvo, setUltimoJobSalvo] = useState<string | null>(null);
  const [verificandoUrl, setVerificandoUrl] = useState(true);

  useEffect(() => {
    try {
      const jobNaUrl = new URLSearchParams(window.location.search).get("job");
      if (jobNaUrl) {
        setJobParaRecuperar(jobNaUrl);
      } else {
        const salvo = localStorage.getItem("tradutor_ultimo_job");
        if (salvo) setUltimoJobSalvo(salvo);
      }
    } catch {
      // localStorage bloqueado (aba anônima, etc.) — segue sem recuperação
    }
    setVerificandoUrl(false);
  }, []);

  function sairDaRecuperacao() {
    try {
      window.history.replaceState({}, "", window.location.pathname);
    } catch {
      // sem problema, só a URL que fica com o parametro a mais
    }
    setJobParaRecuperar(null);
  }

  if (verificandoUrl) return null;

  if (jobParaRecuperar) {
    return (
      <Card className="space-y-6">
        <RecuperarJob jobId={jobParaRecuperar} onComecarDeNovo={sairDaRecuperacao} />
      </Card>
    );
  }

  return (
    <Card className="space-y-6">
      {ultimoJobSalvo && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-2)] px-4 py-3 text-sm">
          <span className="text-[var(--text-secondary)]">Você tem uma tradução recente em andamento ou pronta.</span>
          <button
            onClick={() => setJobParaRecuperar(ultimoJobSalvo)}
            className="font-medium text-[var(--accent-info)] hover:opacity-75"
          >
            Continuar essa tradução
          </button>
        </div>
      )}
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
            <FileText className="h-8 w-8 text-[var(--accent-info)]" />
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
          <IconeIaProcessando className="h-4 w-4" /> Traduzindo a 1ª página...
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

      {estado === "revelado" && resultado && (
        <ResultadoPreview
          resultado={resultado}
          nomeArquivo={arquivo?.name ?? ""}
          onPrecoAtualizado={(novoPreco) => setResultado((r) => (r ? { ...r, preco_centavos: novoPreco } : r))}
        />
      )}
    </Card>
  );
}

function ResultadoPreview({
  resultado,
  nomeArquivo,
  onPrecoAtualizado,
}: {
  resultado: Resultado;
  nomeArquivo: string;
  onPrecoAtualizado: (novoPreco: number) => void;
}) {
  const [lightbox, setLightbox] = useState(false);

  if (resultado.tipo === "pdf_sem_texto") {
    return <AvisoPdfImagem jobId={resultado.job_id} paginasTotal={resultado.paginas_total} />;
  }

  function baixarPdfExemplo() {
    if (resultado.tipo !== "pdf") return;
    const link = document.createElement("a");
    link.href = `data:application/pdf;base64,${resultado.pdf_traduzido_base64}`;
    link.download = "previa-traduzida.pdf";
    link.click();
  }

  return (
    <div className="space-y-5 border-t border-[var(--border)] pt-6">
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

      {resultado.tipo === "pdf" && (
        <div className="flex justify-center">
          <button onClick={baixarPdfExemplo} className="flex items-center gap-1.5 text-xs font-medium text-[var(--accent-info)] hover:opacity-75">
            <Download className="h-3.5 w-3.5" /> Baixar essa página em PDF (texto editável, não imagem)
          </button>
        </div>
      )}

      {lightbox && (
        <Lightbox
          imagemOriginal={`data:image/png;base64,${resultado.imagem_original_base64}`}
          imagemTraduzida={`data:image/png;base64,${resultado.imagem_traduzida_base64}`}
          onClose={() => setLightbox(false)}
        />
      )}

      <div className="space-y-5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            Documento completo: <strong className="text-[var(--text-primary)]">{resultado.paginas_total} página(s)</strong>
          </p>
          <p className="inline-block rounded-2xl bg-gradient-to-b from-sky-500 to-blue-600 px-6 py-2 text-3xl font-extrabold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.4),0_0_16px_3px_rgba(56,189,248,0.5),inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-3px_5px_rgba(0,0,0,0.35),0_4px_10px_rgba(0,0,0,0.4)]">
            {formatarPreco(resultado.preco_centavos)}
          </p>
          {resultado.preco_centavos === PRECO_MINIMO_CENTAVOS ? (
            <p className="text-xs font-medium text-[var(--text-muted)]">
              {formatarPreco(PRECO_MINIMO_CENTAVOS)} é o valor mínimo — vale pra documentos de até{" "}
              {Math.ceil(PRECO_MINIMO_CENTAVOS / resultado.preco_por_pagina_centavos) - 1} página(s); a partir daí o
              preço passa a ser calculado por página.
            </p>
          ) : (
            resultado.preco_por_pagina_centavos < 500 && (
              <p className="text-xs font-medium text-[var(--accent-success)]">
                Desconto de volume aplicado: {formatarPreco(resultado.preco_por_pagina_centavos)}/página
              </p>
            )
          )}
        </div>

        <Checkout
          jobId={resultado.job_id}
          valorCentavos={resultado.preco_centavos}
          onPrecoAtualizado={onPrecoAtualizado}
        />
      </div>
    </div>
  );
}

type EstadoAviso =
  | "escolhendo"
  | "form_tem_original"
  | "calculando_orcamento"
  | "orcamento_pronto"
  | "enviado";

// Mensagens mostradas enquanto "a IA calcula o orçamento" pro caminho de
// quem não tem o arquivo original — puro efeito de percepção de esforço, já
// que o preço em si é matemática (páginas × valor); nenhum processamento
// real acontece nessa espera.
const MENSAGENS_CALCULANDO = [
  "Analisando a complexidade do documento...",
  "Estimando o esforço de reconstrução visual...",
  "Fechando o orçamento do processamento especial...",
];

// Preço especial pra PDF-imagem: mais caro que o preço normal por página
// porque o processamento (quando existir) é bem mais trabalhoso. Mínimo
// igual ao fluxo normal (PRECO_MINIMO_CENTAVOS, definido lá em cima).
const PRECO_ESPECIAL_POR_PAGINA_CENTAVOS = 1000; // R$10/página

function calcularPrecoEspecial(paginas: number) {
  return Math.max(PRECO_MINIMO_CENTAVOS, paginas * PRECO_ESPECIAL_POR_PAGINA_CENTAVOS);
}

// Ícone "IA pensando" reutilizado nas duas esperas do fluxo (a inicial, de
// prévia, e a de calcular o orçamento) — pedido do Robson pra ficar mais
// temático que um spinner genérico.
function IconeIaProcessando({ className = "h-6 w-6" }: { className?: string }) {
  // <span>, não <div> — esse ícone é usado tanto solto (fora de <p>) quanto
  // inline dentro de um <p> (spinner inicial da prévia); <div> dentro de
  // <p> é HTML inválido e quebra a hidratação do React.
  return (
    <span className={`relative mx-auto inline-block ${className}`}>
      <span className="absolute inset-0 animate-ping rounded-full bg-[var(--accent-info)]/30" />
      <BrainCircuit className="relative h-full w-full animate-pulse text-[var(--accent-info)]" />
    </span>
  );
}

// Mostrado quando o backend detecta que o PDF não tem texto extraível (é
// imagem/foto achatada, não um documento real) — caso descoberto com um
// catálogo real que nenhuma ferramenta do mercado conseguiu traduzir. Em vez
// de fingir uma prévia (que sairia idêntica ao original, sem traduzir nada),
// explica a limitação na hora e, se a pessoa quiser orçamento, "calcula" e
// mostra um preço fechado. Ainda não cobra nada de verdade — o
// processamento especial pra esse tipo de arquivo ainda não foi construído,
// então o botão final só captura o interesse (caixa de sugestão existente),
// mas já com o preço concreto na conversa.
function AvisoPdfImagem({ paginasTotal, nomeArquivo }: { paginasTotal: number; nomeArquivo: string }) {
  const [estado, setEstado] = useState<EstadoAviso>("escolhendo");
  const [mensagemIndice, setMensagemIndice] = useState(0);
  const [email, setEmail] = useState("");
  const [detalhe, setDetalhe] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (estado !== "calculando_orcamento") return;

    setMensagemIndice(0);
    // Duração proporcional ao tamanho do documento (mais páginas, mais
    // "trabalho" pra analisar), entre 15 e 20s como combinado.
    const duracaoMs = Math.min(20000, 15000 + paginasTotal * 200);
    const passoMs = duracaoMs / MENSAGENS_CALCULANDO.length;

    const intervalo = setInterval(() => {
      setMensagemIndice((i) => Math.min(i + 1, MENSAGENS_CALCULANDO.length - 1));
    }, passoMs);
    const fim = setTimeout(() => setEstado("orcamento_pronto"), duracaoMs);

    return () => {
      clearInterval(intervalo);
      clearTimeout(fim);
    };
  }, [estado, paginasTotal]);

  async function enviar(tipoPedido: "tem_original" | "quer_orcamento") {
    setEnviando(true);
    setErro(null);
    try {
      const prefixo =
        tipoPedido === "tem_original"
          ? "[PDF-imagem: tem o original]"
          : `[PDF-imagem: quer orçamento — ${formatarPreco(calcularPrecoEspecial(paginasTotal))}]`;
      const mensagem = [
        `${prefixo} Arquivo: "${nomeArquivo}" (${paginasTotal} página(s)).`,
        detalhe ? `Detalhe: ${detalhe}` : null,
      ]
        .filter(Boolean)
        .join(" ");

      const resp = await fetch("/api/sugestoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, mensagem }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.erro ?? "Não deu pra enviar. Tenta de novo.");
      setEstado("enviado");
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setEnviando(false);
    }
  }

  if (estado === "enviado") {
    return (
      <div className="space-y-4 border-t border-[var(--border)] pt-6 text-center">
        <Check className="mx-auto h-8 w-8 text-[var(--accent-success)]" />
        <p className="text-sm font-medium text-[var(--text-primary)]">Recebemos! Vamos te chamar por esse e-mail em breve.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 border-t border-[var(--border)] pt-6">
      <div className="mx-auto max-w-md space-y-2 text-left">
        <div className="flex items-center gap-2">
          <ImageOff className="h-5 w-5 shrink-0 text-[var(--accent-info)]" />
          <p className="text-sm font-semibold text-[var(--text-primary)]">Esse arquivo não é um PDF editável</p>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          É uma imagem (foto ou digitalização) de {paginasTotal} página(s). Nenhuma ferramenta do mercado detecta
          isso automaticamente hoje. A maioria simplesmente devolve o documento intocado, sem avisar. A nossa
          consegue processar, mas é um processo mais lento e mais caro que o normal.
        </p>
      </div>

      {estado === "escolhendo" && (
        <div className="mx-auto max-w-md space-y-3 text-left">
          <p className="text-sm text-[var(--text-secondary)]">
            Antes de qualquer coisa: você tem o arquivo ou link editável original desse documento (Canva, PowerPoint,
            InDesign, Photoshop etc.)?
          </p>
          <div className="flex flex-col justify-center gap-2 sm:flex-row">
            <button onClick={() => setEstado("form_tem_original")} className="group">
              <AcaoPill cor="esmeralda" label="Sim, eu tenho" className="w-full justify-center sm:w-auto" />
            </button>
            <button onClick={() => setEstado("calculando_orcamento")} className="group">
              <AcaoPill cor="azul" label="Não tenho, quero o orçamento" className="w-full justify-center sm:w-auto" />
            </button>
          </div>
        </div>
      )}

      {estado === "form_tem_original" && (
        <div className="mx-auto max-w-md space-y-3 text-left">
          <p className="text-sm text-[var(--text-secondary)]">
            Ótimo. Com o arquivo original a tradução costuma ser bem mais rápida e barata. Deixa seu e-mail e, se
            quiser, o link do design, que a gente entra em contato.
          </p>
          <CampoEmailDetalhe
            email={email}
            setEmail={setEmail}
            detalhe={detalhe}
            setDetalhe={setDetalhe}
            placeholderDetalhe="Link do Canva/design (opcional)"
          />
          {erro && <p className="text-sm text-[var(--accent-danger)]">{erro}</p>}
          <div className="flex justify-center pt-1">
            <button onClick={() => enviar("tem_original")} disabled={enviando || !email} className="group w-full sm:w-auto">
              <AcaoPill cor="esmeralda" label={enviando ? "Enviando..." : "Enviar"} icon={<Send />} className="w-full justify-center sm:w-auto" />
            </button>
          </div>
        </div>
      )}

      {estado === "calculando_orcamento" && (
        <div className="mx-auto max-w-md space-y-4 pt-2 text-center">
          <IconeIaProcessando className="h-10 w-10" />
          <p className="text-sm text-[var(--text-secondary)]">{MENSAGENS_CALCULANDO[mensagemIndice]}</p>
        </div>
      )}

      {estado === "orcamento_pronto" && (
        <div className="mx-auto max-w-md space-y-3 text-left">
          <div className="flex flex-col items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] py-4 text-center">
            <p className="text-xs font-medium text-[var(--text-muted)]">Orçamento pra esse documento</p>
            <p className="inline-block rounded-2xl bg-gradient-to-b from-sky-500 to-blue-600 px-6 py-2 text-2xl font-extrabold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.4),0_0_16px_3px_rgba(56,189,248,0.5),inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-3px_5px_rgba(0,0,0,0.35),0_4px_10px_rgba(0,0,0,0.4)]">
              {formatarPreco(calcularPrecoEspecial(paginasTotal))}
            </p>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            Deixa seu e-mail pra garantir esse preço. O processamento especial pra esse tipo de arquivo ainda está em
            construção, então a gente te chama assim que puder seguir com o pagamento.
          </p>
          <CampoEmailDetalhe
            email={email}
            setEmail={setEmail}
            detalhe={detalhe}
            setDetalhe={setDetalhe}
            placeholderDetalhe="Algo mais que queira contar (opcional)"
          />
          {erro && <p className="text-sm text-[var(--accent-danger)]">{erro}</p>}
          <div className="flex justify-center pt-1">
            <button onClick={() => enviar("quer_orcamento")} disabled={enviando || !email} className="group w-full sm:w-auto">
              <AcaoPill cor="azul" label={enviando ? "Enviando..." : "Quero garantir esse preço"} icon={<Send />} className="w-full justify-center sm:w-auto" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CampoEmailDetalhe({
  email,
  setEmail,
  detalhe,
  setDetalhe,
  placeholderDetalhe,
}: {
  email: string;
  setEmail: (v: string) => void;
  detalhe: string;
  setDetalhe: (v: string) => void;
  placeholderDetalhe: string;
}) {
  return (
    <div className="space-y-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Seu e-mail"
        className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-sky-500/60"
      />
      <input
        type="text"
        value={detalhe}
        onChange={(e) => setDetalhe(e.target.value)}
        placeholder={placeholderDetalhe}
        className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-sky-500/60"
      />
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

function BarraProgressoTraducao({
  progresso,
}: {
  progresso: { feitas: number; total: number; tipoArquivo: string };
}) {
  const { feitas, total, tipoArquivo } = progresso;
  // Sem total ainda (o backend so sabe depois de abrir o arquivo) — mostra
  // uma barra "indeterminada" em vez de travar em 0% parecendo travado.
  const temTotal = total > 0;
  const percentual = temTotal ? Math.min(100, Math.round((feitas / total) * 100)) : 0;

  return (
    <div className="flex w-full flex-col items-center gap-4 text-center">
      <div className="flex items-center gap-2 text-[var(--accent-success)]">
        <ShieldCheck className="h-5 w-5" />
        <p className="text-sm font-semibold text-[var(--text-primary)]">Pagamento confirmado</p>
      </div>

      <div className="w-full max-w-sm space-y-2">
        <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--surface-2)] ring-1 ring-[var(--border)]">
          <div
            className={`h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-600 shadow-[0_0_10px_rgba(56,189,248,0.55)] transition-[width] duration-700 ease-out ${
              temTotal ? "" : "w-1/3 animate-pulse"
            }`}
            style={temTotal ? { width: `${percentual}%` } : undefined}
          />
        </div>
        <p className="text-sm font-medium text-[var(--text-primary)]">
          {temTotal
            ? tipoArquivo === "pdf"
              ? `Traduzindo página ${feitas} de ${total} — ${percentual}%`
              : `Traduzindo o conteúdo — ${percentual}%`
            : "Preparando o documento..."}
        </p>
      </div>

      <p className="max-w-sm text-xs text-[var(--text-muted)]">
        Mantendo a mesma posição de texto, fonte e imagens do original enquanto traduz. Isso pode levar alguns
        minutos em documentos grandes — fique nesta página até o botão de download aparecer.
      </p>
    </div>
  );
}

// Copia a URL atual (já tem ?job= sincronizado nela) — um jeito de a pessoa
// guardar/mandar pra si mesma o caminho de volta pra essa tradução, sem
// depender do navegador/localStorage.
function CopiarLinkTraducao() {
  const [copiado, setCopiado] = useState(false);

  function copiar() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  return (
    <button
      onClick={copiar}
      className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
    >
      {copiado ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
      {copiado ? "Link copiado!" : "Copiar link desta tradução"}
    </button>
  );
}

// Manda o link de recuperacao por e-mail — a pessoa digita o e-mail dela na
// hora, sem precisar ter informado antes (mantem o fluxo sem formulario
// pro Pix). Funciona pra recuperar de qualquer aparelho, nao so o mesmo
// navegador.
function EnviarPorEmail({ jobId }: { jobId: string }) {
  const [mostrar, setMostrar] = useState(false);
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar() {
    if (!email.trim()) return;
    setEnviando(true);
    setErro(null);
    try {
      const resp = await fetch("/api/enviar-por-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId, email }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.erro ?? "Não deu pra enviar.");
      setEnviado(true);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--accent-success)]">
        <Check className="h-3.5 w-3.5" /> Enviado pra {email}
      </p>
    );
  }

  if (!mostrar) {
    return (
      <button
        onClick={() => setMostrar(true)}
        className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
      >
        <Mail className="h-3.5 w-3.5" /> Enviar por e-mail
      </button>
    );
  }

  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-sky-500/60"
        />
        <button
          onClick={enviar}
          disabled={enviando || !email.trim()}
          className="shrink-0 rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50"
        >
          {enviando ? "..." : "Enviar"}
        </button>
      </div>
      {erro && <p className="text-xs text-[var(--accent-danger)]">{erro}</p>}
    </div>
  );
}

// Retoma uma tradução a partir só do job_id (URL ou localStorage) — usado
// quando a pessoa dá F5, fecha a aba ou volta pelo link depois. Não depende
// de nenhum estado em memória, só do que o job já tem salvo no Supabase.
function RecuperarJob({ jobId, onComecarDeNovo }: { jobId: string; onComecarDeNovo: () => void }) {
  const [estado, setEstado] = useState<"carregando" | "aguardando_pagamento" | "processando" | "pronto" | "erro">(
    "carregando"
  );
  const [progresso, setProgresso] = useState<{ feitas: number; total: number; tipoArquivo: string } | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [nomeArquivo, setNomeArquivo] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let intervalo: ReturnType<typeof setInterval>;

    async function checar() {
      try {
        const resp = await fetch(`/api/jobs/${jobId}`);
        if (!resp.ok) {
          setErro("Não encontramos essa tradução — pode já ter expirado.");
          setEstado("erro");
          clearInterval(intervalo);
          return;
        }
        const data = await resp.json();
        setNomeArquivo(data.nome_arquivo ?? null);

        if (data.status === "pronto") {
          setDownloadUrl(data.download_url);
          setEstado("pronto");
          clearInterval(intervalo);
        } else if (data.status === "erro") {
          setErro(data.erro_mensagem ?? "Deu erro ao processar o documento. Fala com a gente.");
          setEstado("erro");
          clearInterval(intervalo);
        } else if (data.status === "aguardando_pagamento") {
          setEstado("aguardando_pagamento");
        } else {
          setEstado("processando");
          setProgresso({
            feitas: data.unidades_processadas ?? 0,
            total: data.unidades_total ?? 0,
            tipoArquivo: data.tipo_arquivo ?? "pdf",
          });
        }
      } catch {
        // rede instável — tenta de novo no próximo tick
      }
    }

    checar();
    intervalo = setInterval(checar, 4000);
    return () => clearInterval(intervalo);
  }, [jobId]);

  if (estado === "carregando") {
    return (
      <p className="flex items-center justify-center gap-2 py-6 text-sm text-[var(--text-secondary)]">
        <Loader2 className="h-4 w-4 animate-spin" /> Buscando sua tradução...
      </p>
    );
  }

  if (estado === "processando" && progresso) {
    return <BarraProgressoTraducao progresso={progresso} />;
  }

  if (estado === "pronto") {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <p className="text-sm font-medium text-[var(--accent-success)]">
          {nomeArquivo ? `"${nomeArquivo}" está pronto!` : "Seu documento está pronto!"}
        </p>
        {downloadUrl ? (
          <a href={downloadUrl} target="_blank" rel="noreferrer">
            <AcaoPill cor="esmeralda" label="Baixar documento traduzido" icon={<Download className="h-4 w-4" />} />
          </a>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">Gerando o link de download...</p>
        )}
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
          <CopiarLinkTraducao />
          <EnviarPorEmail jobId={jobId} />
        </div>
      </div>
    );
  }

  if (estado === "aguardando_pagamento") {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <p className="text-sm text-[var(--text-secondary)]">Essa tradução ainda não foi paga.</p>
        <button onClick={onComecarDeNovo} className="text-sm font-medium text-[var(--accent-info)] hover:opacity-75">
          Começar de novo
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <p className="text-sm font-medium text-[var(--accent-danger)]">{erro}</p>
      <button onClick={onComecarDeNovo} className="text-sm font-medium text-[var(--accent-info)] hover:opacity-75">
        Começar de novo
      </button>
    </div>
  );
}

// Dispara o evento de conversão do Google Ads uma única vez por checkout —
// o ref garante isso mesmo com o polling batendo a cada 4s.
function dispararConversaoAdsUmaVez(jaDisparouRef: { current: boolean }, valorCentavos: number) {
  if (jaDisparouRef.current) return;
  jaDisparouRef.current = true;
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  gtag?.("event", "conversion", {
    send_to: "AW-18468969186/TMboCMuA6oEdEOK12OZE",
    value: valorCentavos / 100,
    currency: "BRL",
  });
}

function Checkout({
  jobId,
  valorCentavos,
  onPrecoAtualizado,
}: {
  jobId: string;
  valorCentavos: number;
  onPrecoAtualizado: (novoPreco: number) => void;
}) {
  const [etapa, setEtapa] = useState<EtapaCheckout>("escolha");
  const [processandoPix, setProcessandoPix] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pix, setPix] = useState<{ qrCode: string; qrCodeBase64: string } | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [mostrarCartao, setMostrarCartao] = useState(false);
  const [mostrarCupom, setMostrarCupom] = useState(false);
  const [codigoCupom, setCodigoCupom] = useState("");
  const [aplicandoCupom, setAplicandoCupom] = useState(false);
  const [erroCupom, setErroCupom] = useState<string | null>(null);
  const [cupomAplicado, setCupomAplicado] = useState<number | null>(null);
  const [progresso, setProgresso] = useState<{
    statusJob: string;
    feitas: number;
    total: number;
    tipoArquivo: string;
  } | null>(null);
  const conversaoDisparadaRef = useRef(false);

  // Salva o job_id assim que a tela de pagamento existe — se a pessoa der
  // F5 ou fechar a aba, o link (?job=) ou o navegador (localStorage) trazem
  // ela de volta pro mesmo lugar, mesmo depois de já ter pago.
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("job", jobId);
      window.history.replaceState({}, "", url);
      localStorage.setItem("tradutor_ultimo_job", jobId);
    } catch {
      // localStorage/history bloqueados (aba anônima, etc.) — sem recuperação, mas não quebra nada
    }
  }, [jobId]);

  useEffect(() => {
    if (etapa !== "aguardando") return;
    const intervalo = setInterval(async () => {
      try {
        const resp = await fetch(`/api/jobs/${jobId}`);
        const data = await resp.json();
        if (data.status === "pronto") {
          dispararConversaoAdsUmaVez(conversaoDisparadaRef, valorCentavos);
          setDownloadUrl(data.download_url);
          setEtapa("pronto");
          clearInterval(intervalo);
        } else if (data.status === "erro") {
          setErro(data.erro_mensagem ?? "Deu erro ao processar o documento. Fala com a gente.");
          setEtapa("erro");
          clearInterval(intervalo);
        } else {
          // Pagamento em Pix ainda não confirmado continua caindo aqui —
          // só conta como conversão quando sai de "aguardando_pagamento"
          // (webhook confirmou e o job virou "pago"/"processando").
          if (data.status !== "aguardando_pagamento") {
            dispararConversaoAdsUmaVez(conversaoDisparadaRef, valorCentavos);
          }
          setProgresso({
            statusJob: data.status,
            feitas: data.unidades_processadas ?? 0,
            total: data.unidades_total ?? 0,
            tipoArquivo: data.tipo_arquivo ?? "pdf",
          });
        }
      } catch {
        // rede instável — tenta de novo no próximo tick, sem derrubar o polling
      }
    }, 4000);
    return () => clearInterval(intervalo);
  }, [etapa, jobId, valorCentavos]);

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

  const [resgatandoGratis, setResgatandoGratis] = useState(false);

  async function resgatarGratis() {
    setResgatandoGratis(true);
    setErro(null);
    try {
      const resp = await fetch("/api/pagamento/gratis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.erro ?? "Não deu pra liberar a tradução.");
      setEtapa("aguardando");
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setResgatandoGratis(false);
    }
  }

  async function aplicarCupom() {
    if (!codigoCupom.trim()) return;
    setAplicandoCupom(true);
    setErroCupom(null);
    try {
      const resp = await fetch("/api/cupom/aplicar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId, codigo: codigoCupom }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.erro ?? "Não deu pra aplicar o cupom.");
      setCupomAplicado(data.desconto_percentual);
      onPrecoAtualizado(data.preco_centavos);
    } catch (e) {
      setErroCupom(e instanceof Error ? e.message : String(e));
    } finally {
      setAplicandoCupom(false);
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
        <p className="text-sm font-medium text-[var(--accent-success)]">Pagamento confirmado — seu documento está pronto!</p>
        {downloadUrl ? (
          <a href={downloadUrl} target="_blank" rel="noreferrer">
            <AcaoPill cor="esmeralda" label="Baixar documento traduzido" icon={<Download className="h-4 w-4" />} />
          </a>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">Gerando o link de download...</p>
        )}
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
          <CopiarLinkTraducao />
          <EnviarPorEmail jobId={jobId} />
        </div>
      </div>
    );
  }

  if (etapa === "aguardando") {
    // "pago" tambem entra aqui (nao so "processando") — no resgate de cupom
    // gratis o job pula direto pra "pago" e o backend leva um instante pra
    // virar "processando"; sem isso a tela piscaria a mensagem de
    // "confirmando pagamento no cartao" por engano.
    const processando = progresso?.statusJob === "processando" || progresso?.statusJob === "pago";

    if (processando) {
      return <BarraProgressoTraducao progresso={progresso} />;
    }

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
              className="flex items-center gap-1.5 text-xs font-medium text-[var(--accent-info)] hover:opacity-75"
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
        <p className="text-sm font-medium text-[var(--accent-danger)]">{erro}</p>
        <button onClick={() => setEtapa("escolha")} className="text-xs font-medium text-[var(--accent-info)] hover:opacity-75">
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
        {erro && <p className="text-center text-sm text-[var(--accent-danger)]">{erro}</p>}
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
    <div className="flex flex-col items-center gap-3">
      {cupomAplicado !== null ? (
        <p className="flex items-center gap-1.5 text-sm font-medium text-[var(--accent-success)]">
          <Tag className="h-4 w-4" /> Cupom aplicado: {cupomAplicado}% de desconto
        </p>
      ) : mostrarCupom ? (
        <div className="flex w-full max-w-xs flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={codigoCupom}
              onChange={(e) => setCodigoCupom(e.target.value)}
              placeholder="Código do cupom"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-sky-500/60"
            />
            <button
              onClick={aplicarCupom}
              disabled={aplicandoCupom || !codigoCupom.trim()}
              className="shrink-0 rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50"
            >
              {aplicandoCupom ? "..." : "Aplicar"}
            </button>
          </div>
          {erroCupom && <p className="text-xs text-[var(--accent-danger)]">{erroCupom}</p>}
        </div>
      ) : (
        <button
          onClick={() => setMostrarCupom(true)}
          className="flex items-center gap-2 rounded-xl border border-dashed border-[var(--border-strong)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:border-sky-500/50 hover:text-[var(--text-primary)]"
        >
          <Tag className="h-4 w-4" /> Tenho um cupom
        </button>
      )}

      {valorCentavos === 0 ? (
        <button onClick={resgatarGratis} disabled={resgatandoGratis} className="group w-full sm:w-auto">
          <AcaoPill
            cor="esmeralda"
            label={resgatandoGratis ? "Liberando..." : "Traduzir documento"}
            icon={<FileText className="h-4 w-4" />}
            pressionado={resgatandoGratis}
            className="w-full justify-center sm:w-auto"
          />
        </button>
      ) : (
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
        </div>
      )}
      {erro && <p className="w-full text-center text-sm text-[var(--accent-danger)]">{erro}</p>}
    </div>
  );
}
