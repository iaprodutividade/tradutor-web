import "server-only";
import { NextResponse } from "next/server";
import { createAdminClient, BUCKET_ARQUIVOS } from "@/lib/supabase/admin";

// Usado pelo frontend pra fazer polling depois do pagamento — quando o job
// chega em "pronto", devolve uma URL assinada de download (o bucket é
// privado, ninguém baixa o arquivo de outra pessoa só sabendo o job_id porque
// o id é um UUID aleatório, mas mesmo assim a URL expira).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: job, error } = await supabase.from("jobs").select("*").eq("id", id).single();
  if (error || !job) {
    return NextResponse.json({ erro: "Job não encontrado." }, { status: 404 });
  }

  let downloadUrl: string | null = null;
  if (job.status === "pronto" && job.arquivo_traduzido_path) {
    const { data: signed } = await supabase.storage
      .from(BUCKET_ARQUIVOS)
      .createSignedUrl(job.arquivo_traduzido_path, 60 * 60);
    downloadUrl = signed?.signedUrl ?? null;
  }

  return NextResponse.json({
    status: job.status,
    erro_mensagem: job.erro_mensagem,
    download_url: downloadUrl,
    nome_arquivo: job.nome_arquivo,
    tipo_arquivo: job.tipo_arquivo,
    unidades_processadas: job.unidades_processadas,
    unidades_total: job.unidades_total,
  });
}
