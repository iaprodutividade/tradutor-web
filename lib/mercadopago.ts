import "server-only";
import { randomUUID } from "crypto";

const MERCADOPAGO_BASE_URL = "https://api.mercadopago.com";

function apiKey(): string {
  const key = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!key) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurada.");
  return key;
}

function notificationUrl(): string | undefined {
  const site = process.env.SITE_URL;
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  // Mercado Pago rejeita URL não pública (ex.: localhost) — em dev local,
  // omitimos e confirmamos o pagamento consultando a API diretamente.
  if (!site || !secret || !site.startsWith("https://")) return undefined;
  return `${site}/api/webhooks/mercadopago?secret=${secret}`;
}

type PagadorBase = {
  payerEmail: string;
  cpf: string;
};

// Pix não pede nome nem CPF do pagador — testado direto na API de produção
// (payments criados e cancelados sem gerar cobrança real): o Mercado Pago só
// exige "payer.email" pra criar a cobrança Pix, o resto é opcional. Menos
// atrito no checkout: quem paga não digita nada, só escaneia o QR Code.
export async function criarPagamentoPix(params: {
  valorCentavos: number;
  descricao: string;
  externalReference: string;
  payerEmail: string;
}): Promise<{ paymentId: string; qrCode: string; qrCodeImagemBase64: string; status: string }> {
  const resp = await fetch(`${MERCADOPAGO_BASE_URL}/v1/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey()}`,
      "X-Idempotency-Key": randomUUID(),
    },
    body: JSON.stringify({
      transaction_amount: params.valorCentavos / 100,
      description: params.descricao,
      payment_method_id: "pix",
      external_reference: params.externalReference,
      notification_url: notificationUrl(),
      payer: { email: params.payerEmail },
    }),
  });

  const json = await resp.json();
  if (!resp.ok) {
    throw new Error(`Mercado Pago /payments (pix) falhou (${resp.status}): ${JSON.stringify(json).slice(0, 500)}`);
  }

  const transactionData = json.point_of_interaction?.transaction_data;
  if (!transactionData?.qr_code) throw new Error("Mercado Pago não retornou QR Code do Pix.");

  return {
    paymentId: String(json.id),
    qrCode: transactionData.qr_code,
    qrCodeImagemBase64: transactionData.qr_code_base64,
    status: json.status,
  };
}

export async function criarPagamentoCartao(
  params: PagadorBase & {
    valorCentavos: number;
    descricao: string;
    externalReference: string;
    token: string;
    installments: number;
    paymentMethodId: string;
    issuerId?: string;
  }
): Promise<{ paymentId: string; status: string; statusDetail: string }> {
  const resp = await fetch(`${MERCADOPAGO_BASE_URL}/v1/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey()}`,
      "X-Idempotency-Key": randomUUID(),
    },
    body: JSON.stringify({
      transaction_amount: params.valorCentavos / 100,
      description: params.descricao,
      external_reference: params.externalReference,
      notification_url: notificationUrl(),
      token: params.token,
      installments: params.installments,
      payment_method_id: params.paymentMethodId,
      issuer_id: params.issuerId,
      payer: {
        email: params.payerEmail,
        identification: { type: "CPF", number: params.cpf },
      },
    }),
  });

  const json = await resp.json();
  if (!resp.ok) {
    throw new Error(`Mercado Pago /payments (cartão) falhou (${resp.status}): ${JSON.stringify(json).slice(0, 500)}`);
  }

  return {
    paymentId: String(json.id),
    status: json.status,
    statusDetail: json.status_detail,
  };
}

export async function buscarPagamento(paymentId: string): Promise<{
  status: string;
  externalReference: string | null;
  valorCentavos: number;
  metodo: "pix" | "cartao";
  parcelas: number | null;
}> {
  const resp = await fetch(`${MERCADOPAGO_BASE_URL}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${apiKey()}` },
  });
  const json = await resp.json();
  if (!resp.ok) {
    throw new Error(`Mercado Pago /payments/${paymentId} falhou (${resp.status}): ${JSON.stringify(json).slice(0, 500)}`);
  }
  return {
    status: json.status,
    externalReference: json.external_reference ?? null,
    valorCentavos: Math.round((json.transaction_amount ?? 0) * 100),
    metodo: json.payment_type_id === "pix" ? "pix" : "cartao",
    parcelas: json.installments ?? null,
  };
}
