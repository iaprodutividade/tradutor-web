import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { estaProntoParaPagar } from "@/lib/job-status";

// Aplica um cupom de desconto num job ainda nao pago. O preco final e
// calculado e gravado no proprio job (preco_centavos) aqui no servidor —
// os endpoints de pagamento (pix/cartao) so leem esse campo, entao ninguem
// consegue forjar desconto mandando um valor diferente do navegador.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const jobId = typeof body?.job_id === "string" ? body.job_id : null;
  const codigo = typeof body?.codigo === "string" ? body.codigo.trim().toUpperCase() : "";

  if (!jobId || !codigo) {
    return NextResponse.json({ erro: "Informe o código do cupom." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: job, error: erroJob } = await supabase.from("jobs").select("*").eq("id", jobId).single();
  if (erroJob || !job) {
    return NextResponse.json({ erro: "Job não encontrado." }, { status: 404 });
  }
  if (!estaProntoParaPagar(job.status)) {
    return NextResponse.json({ erro: `Este job já está com status "${job.status}".` }, { status: 409 });
  }
  if (job.cupom_codigo) {
    return NextResponse.json({ erro: "Esse job já tem um cupom aplicado." }, { status: 409 });
  }

  const { data: cupom, error: erroCupom } = await supabase
    .from("cupons")
    .select("*")
    .eq("codigo", codigo)
    .maybeSingle();

  if (erroCupom || !cupom) {
    return NextResponse.json({ erro: "Cupom não encontrado." }, { status: 404 });
  }
  if (!cupom.ativo) {
    return NextResponse.json({ erro: "Esse cupom não está mais ativo." }, { status: 409 });
  }
  if (cupom.usos_atuais >= cupom.usos_maximos) {
    return NextResponse.json({ erro: "Esse cupom já foi usado o número máximo de vezes." }, { status: 409 });
  }

  const precoOriginal: number = job.preco_centavos;
  const precoComDesconto = Math.max(0, Math.round(precoOriginal * (1 - cupom.desconto_percentual / 100)));

  const { error: erroUpdateJob } = await supabase
    .from("jobs")
    .update({ preco_centavos: precoComDesconto, cupom_codigo: cupom.codigo })
    .eq("id", jobId);
  if (erroUpdateJob) {
    return NextResponse.json({ erro: `Falha ao aplicar o cupom: ${erroUpdateJob.message}` }, { status: 500 });
  }

  await supabase
    .from("cupons")
    .update({ usos_atuais: cupom.usos_atuais + 1 })
    .eq("id", cupom.id);

  return NextResponse.json({
    ok: true,
    desconto_percentual: cupom.desconto_percentual,
    preco_centavos: precoComDesconto,
  });
}
