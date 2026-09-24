import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dispararProcessamentoCompleto } from "@/lib/tradutor-processamento";
import { estaProntoParaPagar } from "@/lib/job-status";

// Resgate de cupom 100% off — pula o Mercado Pago inteiramente (nao faz
// sentido cobrar/aprovar um pagamento de R$0,00). So libera se o job tiver
// preco_centavos = 0 de verdade no banco (o valor ja foi recalculado com
// seguranca em /api/cupom/aplicar; aqui so confere de novo antes de liberar).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const jobId = typeof body?.job_id === "string" ? body.job_id : null;
  if (!jobId) {
    return NextResponse.json({ erro: "Informe job_id." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: job, error: erroJob } = await supabase.from("jobs").select("*").eq("id", jobId).single();
  if (erroJob || !job) {
    return NextResponse.json({ erro: "Job não encontrado." }, { status: 404 });
  }
  if (!estaProntoParaPagar(job.status)) {
    return NextResponse.json({ erro: `Este job já está com status "${job.status}".` }, { status: 409 });
  }
  if (job.preco_centavos !== 0) {
    return NextResponse.json({ erro: "Esse job não está zerado — use Pix ou cartão." }, { status: 409 });
  }

  await supabase.from("jobs").update({ status: "pago" }).eq("id", jobId);

  try {
    await dispararProcessamentoCompleto(jobId);
  } catch (err) {
    return NextResponse.json({ erro: String(err instanceof Error ? err.message : err) }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
