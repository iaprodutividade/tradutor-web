import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buscarPagamento } from "@/lib/mercadopago";

// Webhook do Mercado Pago — só avisa o id do pagamento (topic=payment),
// então buscamos os detalhes de verdade na API antes de confirmar. Único
// gatilho que marca o job como "pago" e dispara o processamento completo no
// backend — tanto Pix quanto cartão passam por aqui (cartão já respondeu
// approved/rejected na hora pro pagador, mas a liberação em si é daqui).
export async function POST(req: NextRequest) {
  const segredo = req.nextUrl.searchParams.get("secret");
  if (segredo !== process.env.MERCADOPAGO_WEBHOOK_SECRET) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  if (body.type !== "payment" || !body.data?.id) {
    return NextResponse.json({ ok: true, ignorado: "não é notificação de pagamento" });
  }

  try {
    const pagamento = await buscarPagamento(String(body.data.id));
    const jobId = pagamento.externalReference;
    if (!jobId) return NextResponse.json({ ok: true, ignorado: "sem external_reference" });

    const supabase = createAdminClient();
    const pago = pagamento.status === "approved";

    await supabase.from("pagamentos").upsert(
      {
        job_id: jobId,
        provider_payment_id: String(body.data.id),
        provedor: "mercadopago",
        metodo: pagamento.metodo,
        parcelas: pagamento.parcelas,
        valor_centavos: pagamento.valorCentavos,
        status: pagamento.status,
        pago_em: pago ? new Date().toISOString() : null,
      },
      { onConflict: "provider_payment_id" }
    );

    if (pago) {
      const { data: job } = await supabase.from("jobs").select("*").eq("id", jobId).single();
      // Idempotente: só dispara o processamento se ainda não tiver sido
      // disparado (o Mercado Pago pode reenviar a mesma notificação).
      if (job && job.status === "aguardando_pagamento") {
        await supabase.from("jobs").update({ status: "pago" }).eq("id", jobId);
        await dispararProcessamentoCompleto(jobId);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ erro: String(err instanceof Error ? err.message : err) }, { status: 500 });
  }
}

// Só entrega o job pro backend (VPS Andrea) e espera a confirmação de
// recebimento (202) — o processamento em si roda em background lá, pode
// levar minutos num documento grande, e uma função serverless não aguentaria
// esperar isso.
async function dispararProcessamentoCompleto(jobId: string) {
  const apiUrl = process.env.TRADUTOR_API_URL;
  const apiKey = process.env.TRADUTOR_API_KEY;
  if (!apiUrl || !apiKey) throw new Error("Backend não configurado (TRADUTOR_API_URL/TRADUTOR_API_KEY).");

  const resp = await fetch(`${apiUrl}/traduzir-completo`, {
    method: "POST",
    headers: { "X-Api-Key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ job_id: jobId }),
  });
  if (!resp.ok) {
    const texto = await resp.text();
    throw new Error(`Backend /traduzir-completo recusou o job ${jobId} (${resp.status}): ${texto.slice(0, 300)}`);
  }
}
