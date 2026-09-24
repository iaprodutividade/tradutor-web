import "server-only";
import { NextRequest, NextResponse } from "next/server";

// Dispara o processamento de verdade das primeiras páginas de um
// PDF-imagem — assíncrono (o backend devolve 202 na hora e processa em
// background), porque a chamada real leva 1-2min, mais do que uma função
// serverless aguenta segurar aberta numa chamada só. O frontend faz
// polling em /api/jobs/{id} até o status virar "previa_imagem_pronta".
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const jobId = typeof body?.job_id === "string" ? body.job_id : null;
  if (!jobId) {
    return NextResponse.json({ erro: "job_id é obrigatório." }, { status: 400 });
  }

  const apiUrl = process.env.TRADUTOR_API_URL;
  const apiKey = process.env.TRADUTOR_API_KEY;
  if (!apiUrl || !apiKey) {
    return NextResponse.json({ erro: "Backend não configurado." }, { status: 500 });
  }

  const resp = await fetch(`${apiUrl}/gerar-previa-imagem`, {
    method: "POST",
    headers: { "X-Api-Key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ job_id: jobId }),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    return NextResponse.json(data, { status: resp.status });
  }
  return NextResponse.json(data, { status: 202 });
}
