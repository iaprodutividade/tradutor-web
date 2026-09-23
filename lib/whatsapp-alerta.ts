import "server-only";

// Mesmo mecanismo usado no Hub (src/lib/evolution-api.ts) — instância "avisos"
// na Evolution API da VPS Andrea, atrás de Basic Auth do Caddy + apikey
// própria. Só avisa o Robson (ALERTA_WHATSAPP_ROBSON), sem UI nem histórico —
// é só um "toque" no celular, o painel de pagamentos é a fonte de verdade.
export async function enviarAlertaWhatsApp(texto: string): Promise<{ ok: boolean; erro?: string }> {
  const url = process.env.EVOLUTION_API_URL;
  const instancia = process.env.EVOLUTION_API_INSTANCE;
  const chave = process.env.EVOLUTION_API_KEY;
  const basicUser = process.env.EVOLUTION_API_BASIC_USER;
  const basicPass = process.env.EVOLUTION_API_BASIC_PASS;
  const numero = process.env.ALERTA_WHATSAPP_ROBSON;

  if (!url || !instancia || !chave || !numero) {
    return { ok: false, erro: "Evolution API não configurada (faltam env vars)" };
  }

  const headers: Record<string, string> = { "Content-Type": "application/json", apikey: chave };
  if (basicUser && basicPass) {
    headers.Authorization = `Basic ${Buffer.from(`${basicUser}:${basicPass}`).toString("base64")}`;
  }

  const resposta = await fetch(`${url}/message/sendText/${instancia}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ number: numero, text: texto }),
  });

  if (!resposta.ok) {
    const corpo = await resposta.text();
    return { ok: false, erro: `Evolution API retornou ${resposta.status}: ${corpo.slice(0, 300)}` };
  }
  return { ok: true };
}

const IDIOMA_LABEL: Record<string, string> = {
  pt: "Português",
  en: "Inglês",
  es: "Espanhol",
  fr: "Francês",
  de: "Alemão",
  it: "Italiano",
};

export function montarMensagemVenda(params: {
  nomeArquivo: string;
  idiomaOrigem: string;
  idiomaDestino: string;
  paginasTotal: number;
  valorCentavos: number;
  metodo: "pix" | "cartao";
  parcelas: number | null;
  cupomCodigo: string | null;
}): string {
  const origem = IDIOMA_LABEL[params.idiomaOrigem] ?? params.idiomaOrigem.toUpperCase();
  const destino = IDIOMA_LABEL[params.idiomaDestino] ?? params.idiomaDestino.toUpperCase();
  const valor = (params.valorCentavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const metodoTexto = params.metodo === "pix" ? "Pix" : `Cartão${params.parcelas && params.parcelas > 1 ? ` (${params.parcelas}x)` : ""}`;

  return [
    "💰 *Venda no Tradutor!*",
    "",
    `📄 ${params.nomeArquivo}`,
    `🌐 ${origem} → ${destino} · ${params.paginasTotal} pág.`,
    `💳 ${metodoTexto}`,
    `💵 ${valor}`,
    params.cupomCodigo ? `🎟️ Cupom: ${params.cupomCodigo}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}
