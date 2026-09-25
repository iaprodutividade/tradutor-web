import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Essa função espera o backend baixar o arquivo (até 50MB) do Storage e
// processar a 1ª página antes de responder -- o timeout padrão da Vercel
// (bem mais curto) poderia matar a função no meio de um arquivo grande.
export const maxDuration = 60;

// Segundo passo do upload direto pro Storage: o navegador já subiu o
// arquivo (via URL assinada de /iniciar), essa rota só manda o CAMINHO pro
// backend processar a prévia -- nunca os bytes do arquivo em si, então
// nunca esbarra no limite de payload do Vercel (~4,5MB por função
// serverless, descoberto 25/09/2026 testando um catálogo real de 11MB que
// o /api/preview antigo, multipart, nunca conseguiria processar).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const jobId = typeof body?.job_id === "string" ? body.job_id : null;
  const path = typeof body?.path === "string" ? body.path : null;
  const nomeArquivo = typeof body?.nome_arquivo === "string" ? body.nome_arquivo : null;
  const idiomaOrigem = typeof body?.idioma_origem === "string" ? body.idioma_origem : null;
  const idiomaDestino = typeof body?.idioma_destino === "string" ? body.idioma_destino : null;
  const converterUnidades = body?.converter_unidades === true;

  if (!jobId || !path || !nomeArquivo || !idiomaOrigem || !idiomaDestino) {
    return NextResponse.json({ erro: "Dados incompletos pra finalizar o upload." }, { status: 400 });
  }

  const apiUrl = process.env.TRADUTOR_API_URL;
  const apiKey = process.env.TRADUTOR_API_KEY;
  if (!apiUrl || !apiKey) {
    return NextResponse.json({ erro: "Backend não configurado." }, { status: 500 });
  }

  // Repassa o IP de verdade do cliente pro backend -- sem isso, o
  // rate-limit por IP do Python veria sempre o IP do Vercel (chamada
  // servidor-a-servidor), não o do visitante.
  const ipCliente = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";

  const resp = await fetch(`${apiUrl}/preview-do-storage`, {
    method: "POST",
    headers: {
      "X-Api-Key": apiKey,
      "Content-Type": "application/json",
      ...(ipCliente ? { "X-Forwarded-For": ipCliente } : {}),
    },
    body: JSON.stringify({
      arquivo_original_path: path,
      idioma_origem: idiomaOrigem,
      idioma_destino: idiomaDestino,
    }),
  });

  const data = await resp.json();
  if (!resp.ok) {
    return NextResponse.json(data, { status: resp.status });
  }

  const ehPdfImagem = data.tipo === "pdf_sem_texto";
  const supabase = createAdminClient();
  const { error: erroInsert } = await supabase.from("jobs").insert({
    id: jobId,
    tipo_arquivo: data.tipo,
    nome_arquivo: nomeArquivo,
    idioma_origem: idiomaOrigem,
    idioma_destino: idiomaDestino,
    converter_unidades: converterUnidades,
    paginas_total: data.paginas_total,
    preco_centavos: ehPdfImagem ? null : data.preco_centavos,
    arquivo_original_path: path,
    ip_cliente: ipCliente || null,
    status: ehPdfImagem ? "aguardando_previa_imagem" : undefined,
  });
  if (erroInsert) {
    return NextResponse.json({ erro: `Falha ao criar o job: ${erroInsert.message}` }, { status: 500 });
  }

  return NextResponse.json({ ...data, job_id: jobId });
}
