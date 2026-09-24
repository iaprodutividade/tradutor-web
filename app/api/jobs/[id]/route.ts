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

  let previaImagemUrls: string[] | null = null;
  let previaImagemOriginalUrls: string[] | null = null;
  if (job.status === "previa_imagem_pronta" && Array.isArray(job.previas_imagem_paths)) {
    const assinadas = await Promise.all(
      (job.previas_imagem_paths as string[]).map((caminho) =>
        supabase.storage.from(BUCKET_ARQUIVOS).createSignedUrl(caminho, 60 * 30)
      )
    );
    previaImagemUrls = assinadas.map((r) => r.data?.signedUrl).filter((u): u is string => Boolean(u));

    if (Array.isArray(job.previas_imagem_originais_paths)) {
      const assinadasOriginais = await Promise.all(
        (job.previas_imagem_originais_paths as string[]).map((caminho) =>
          supabase.storage.from(BUCKET_ARQUIVOS).createSignedUrl(caminho, 60 * 30)
        )
      );
      previaImagemOriginalUrls = assinadasOriginais.map((r) => r.data?.signedUrl).filter((u): u is string => Boolean(u));
    }
  }

  let downloadUrl: string | null = null;
  if (job.status === "pronto" && job.arquivo_traduzido_path) {
    // Nome amigavel pro download (o path no Storage e so o job_id, um UUID)
    // — nome original + "-traduzido", em vez do arquivo salvo com um UUID cru.
    const nomeOriginal: string = job.nome_arquivo || "documento";
    const pontoExtensao = nomeOriginal.lastIndexOf(".");
    const nomeDownload =
      pontoExtensao > 0
        ? `${nomeOriginal.slice(0, pontoExtensao)}-traduzido${nomeOriginal.slice(pontoExtensao)}`
        : `${nomeOriginal}-traduzido`;

    const { data: signed } = await supabase.storage
      .from(BUCKET_ARQUIVOS)
      .createSignedUrl(job.arquivo_traduzido_path, 60 * 60, { download: nomeDownload });
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
    preco_centavos: job.preco_centavos,
    previa_imagem_urls: previaImagemUrls,
    previa_imagem_original_urls: previaImagemOriginalUrls,
    paginas_gratis: Array.isArray(job.paginas_gratis_indices) ? job.paginas_gratis_indices : [],
  });
}
