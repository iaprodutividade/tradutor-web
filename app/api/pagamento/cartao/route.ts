import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { criarPagamentoCartao } from "@/lib/mercadopago";

// Recebe o token já gerado no navegador pelo Card Payment Brick — o número
// do cartão nunca passa por aqui nem pelo nosso backend.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { job_id, email, cpf, token, installments, payment_method_id, issuer_id } = body ?? {};
  if (!job_id || !email || !cpf || !token || !installments || !payment_method_id) {
    return NextResponse.json({ erro: "Dados de pagamento incompletos." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: job, error: erroJob } = await supabase.from("jobs").select("*").eq("id", job_id).single();
  if (erroJob || !job) {
    return NextResponse.json({ erro: "Job não encontrado." }, { status: 404 });
  }
  if (job.status !== "aguardando_pagamento") {
    return NextResponse.json({ erro: `Este job já está com status "${job.status}".` }, { status: 409 });
  }

  try {
    const pagamento = await criarPagamentoCartao({
      valorCentavos: job.preco_centavos,
      descricao: `Tradução — ${job.nome_arquivo}`,
      externalReference: job.id,
      payerEmail: email,
      cpf,
      token,
      installments,
      paymentMethodId: payment_method_id,
      issuerId: issuer_id,
    });

    await supabase.from("pagamentos").upsert(
      {
        job_id: job.id,
        provider_payment_id: pagamento.paymentId,
        provedor: "mercadopago",
        metodo: "cartao",
        parcelas: installments,
        valor_centavos: job.preco_centavos,
        status: pagamento.status,
        // E-mail já é coletado pelo Card Payment Brick pra tokenizar o
        // cartão (exigência do Mercado Pago) — só passou a ser salvo aqui,
        // não é um campo novo no checkout. CPF fica de fora por decisão do
        // Robson (não é do interesse dele guardar).
        payer_email: email,
      },
      { onConflict: "provider_payment_id" }
    );

    // Pagamento com cartão é decidido na hora (approved/rejected/in_process) —
    // sem precisar esperar o webhook pra dar feedback imediato ao pagador. A
    // liberação do arquivo em si (marcar "pago" + disparar o processamento)
    // continua sendo feita pelo webhook, única fonte de verdade do status.
    return NextResponse.json({
      payment_id: pagamento.paymentId,
      status: pagamento.status,
      status_detail: pagamento.statusDetail,
    });
  } catch (err) {
    return NextResponse.json({ erro: String(err instanceof Error ? err.message : err) }, { status: 500 });
  }
}
