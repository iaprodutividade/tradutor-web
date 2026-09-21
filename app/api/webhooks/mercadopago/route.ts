import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buscarPagamento } from "@/lib/mercadopago";
import { dispararProcessamentoCompleto } from "@/lib/tradutor-processamento";

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
        payer_bank_nome: pagamento.bankNome,
        valor_liquido_centavos: pagamento.valorLiquidoCentavos,
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
