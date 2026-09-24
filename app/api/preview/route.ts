import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, BUCKET_ARQUIVOS } from "@/lib/supabase/admin";

// Repassa o upload pro backend (tradutor-api na VPS Andrea) incluindo a
// chave de API secreta, que nunca deve chegar ao navegador do cliente. Além
// da prévia, guarda o arquivo original no Storage e cria o job no Supabase,
// pra poder cobrar e processar o documento completo depois sem re-upload.
export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const arquivo = formData.get("arquivo");
  const idiomaOrigem = formData.get("idioma_origem");
  const idiomaDestino = formData.get("idioma_destino");
  if (!(arquivo instanceof File) || typeof idiomaOrigem !== "string" || typeof idiomaDestino !== "string") {
    return NextResponse.json({ erro: "Envie um arquivo e os idiomas de origem/destino." }, { status: 400 });
  }

  const apiUrl = process.env.TRADUTOR_API_URL;
  const apiKey = process.env.TRADUTOR_API_KEY;
  if (!apiUrl || !apiKey) {
    return NextResponse.json({ erro: "Backend não configurado." }, { status: 500 });
  }

  const resp = await fetch(`${apiUrl}/preview`, {
    method: "POST",
    headers: { "X-Api-Key": apiKey },
    body: formData,
  });

  const data = await resp.json();
  if (!resp.ok) {
    return NextResponse.json(data, { status: resp.status });
  }

  const extensao = arquivo.name.split(".").pop()?.toLowerCase() ?? "pdf";
  const supabase = createAdminClient();
  const jobId = crypto.randomUUID();
  const arquivoOriginalPath = `originais/${jobId}.${extensao}`;

  // PDF-imagem (sem texto extraível) também sobe pro Storage e cria job —
  // precisa disso pra disparar o processamento assíncrono em
  // /api/gerar-previa-imagem depois (o backend baixa o arquivo original
  // pelo job, não recebe upload de novo). Preço só é definido quando a
  // prévia terminar de processar (não sabemos ainda se vai custar mais
  // ou menos até rodar de verdade).
  const ehPdfImagem = data.tipo === "pdf_sem_texto";

  const { error: erroUpload } = await supabase.storage
    .from(BUCKET_ARQUIVOS)
    .upload(arquivoOriginalPath, await arquivo.arrayBuffer(), {
      contentType: arquivo.type || undefined,
      upsert: false,
    });
  if (erroUpload) {
    return NextResponse.json({ erro: `Falha ao guardar o arquivo: ${erroUpload.message}` }, { status: 500 });
  }

  const ipCliente = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const { error: erroInsert } = await supabase.from("jobs").insert({
    id: jobId,
    tipo_arquivo: data.tipo,
    nome_arquivo: arquivo.name,
    idioma_origem: idiomaOrigem,
    idioma_destino: idiomaDestino,
    converter_unidades: formData.get("converter_unidades") === "true",
    paginas_total: data.paginas_total,
    preco_centavos: ehPdfImagem ? null : data.preco_centavos,
    arquivo_original_path: arquivoOriginalPath,
    ip_cliente: ipCliente,
    status: ehPdfImagem ? "aguardando_previa_imagem" : undefined,
  });
  if (erroInsert) {
    return NextResponse.json({ erro: `Falha ao criar o job: ${erroInsert.message}` }, { status: 500 });
  }

  return NextResponse.json({ ...data, job_id: jobId }, { status: resp.status });
}
