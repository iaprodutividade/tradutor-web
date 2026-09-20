import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { criarPagamentoPix } from "@/lib/mercadopago";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { job_id } = body ?? {};
  if (!job_id) {
    return NextResponse.json({ erro: "Informe job_id." }, { status: 400 });
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
    // Sem formulário: o Mercado Pago só exige um e-mail pra criar a cobrança
    // Pix (nome e CPF não são obrigatórios, confirmado direto na API), e a
    // liberação do arquivo é feita na própria aba via polling — não depende
    // de e-mail nenhum. O endereço sintético é só pra satisfazer a API.
    const pagamento = await criarPagamentoPix({
      valorCentavos: job.preco_centavos,
      descricao: `Tradução — ${job.nome_arquivo}`,
      externalReference: job.id,
      payerEmail: `pagador+${job.id}@plataformafacil.com.br`,
    });

    await supabase.from("pagamentos").upsert(
      {
        job_id: job.id,
        provider_payment_id: pagamento.paymentId,
        provedor: "mercadopago",
        metodo: "pix",
        valor_centavos: job.preco_centavos,
        status: pagamento.status,
      },
      { onConflict: "provider_payment_id" }
    );

    return NextResponse.json({
      payment_id: pagamento.paymentId,
      qr_code: pagamento.qrCode,
      qr_code_base64: pagamento.qrCodeImagemBase64,
      status: pagamento.status,
    });
  } catch (err) {
    return NextResponse.json({ erro: String(err instanceof Error ? err.message : err) }, { status: 500 });
  }
}
