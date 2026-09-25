import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, BUCKET_ARQUIVOS } from "@/lib/supabase/admin";

// Primeiro passo do upload direto pro Storage (ver finalizar/route.ts pro
// motivo): gera o job_id e uma URL assinada de upload, sem receber nenhum
// byte de arquivo -- essa requisição é só JSON pequeno, nunca esbarra no
// limite de payload do Vercel.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const nomeArquivo = typeof body?.nome_arquivo === "string" ? body.nome_arquivo : null;
  if (!nomeArquivo) {
    return NextResponse.json({ erro: "Informe nome_arquivo." }, { status: 400 });
  }

  const extensao = nomeArquivo.split(".").pop()?.toLowerCase() ?? "pdf";
  const jobId = crypto.randomUUID();
  const arquivoOriginalPath = `originais/${jobId}.${extensao}`;

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.from(BUCKET_ARQUIVOS).createSignedUploadUrl(arquivoOriginalPath);
  if (error || !data) {
    return NextResponse.json({ erro: `Falha ao preparar o upload: ${error?.message}` }, { status: 500 });
  }

  return NextResponse.json({
    job_id: jobId,
    path: arquivoOriginalPath,
    token: data.token,
  });
}
