import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

// Remetente de teste do Resend — funciona sem configurar nada, mas o
// Resend recomenda verificar um dominio proprio (plataformafacil.com.br)
// pra entrega de verdade em producao. Trocar aqui quando isso acontecer.
const REMETENTE = "Tradutor <onboarding@resend.dev>";

const resend = new Resend(process.env.RESEND_API_KEY);

// Manda o link de recuperacao da traducao por e-mail — pra quem quer
// garantir acesso de outro aparelho, ou simplesmente nao confia em guardar
// o link/navegador. Funciona em qualquer status do job: se ainda estiver
// processando, a pagina de recuperacao mostra o progresso; se ja estiver
// pronto, mostra o botao de download.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const jobId = typeof body?.job_id === "string" ? body.job_id : null;
  const email = typeof body?.email === "string" ? body.email.trim() : "";

  if (!jobId) {
    return NextResponse.json({ erro: "Informe job_id." }, { status: 400 });
  }
  if (!email || !email.includes("@")) {
    return NextResponse.json({ erro: "Informe um e-mail válido." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: job, error: erroJob } = await supabase.from("jobs").select("*").eq("id", jobId).single();
  if (erroJob || !job) {
    return NextResponse.json({ erro: "Job não encontrado." }, { status: 404 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tradutor.plataformafacil.com.br";
  const link = `${siteUrl}/?job=${jobId}`;
  const pronto = job.status === "pronto";

  try {
    const { error } = await resend.emails.send({
      from: REMETENTE,
      to: [email],
      subject: pronto ? "Sua tradução está pronta" : "Acompanhe sua tradução",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #0369a1;">${pronto ? "Sua tradução está pronta! 🎉" : "Sua tradução está a caminho"}</h2>
          <p>Documento: <strong>${job.nome_arquivo ?? "seu documento"}</strong></p>
          <p>${
            pronto
              ? "Clique no link abaixo pra baixar o arquivo traduzido:"
              : "Ainda estamos traduzindo — clique no link abaixo a qualquer momento pra acompanhar o progresso e baixar assim que terminar:"
          }</p>
          <p style="margin: 24px 0;">
            <a href="${link}" style="background: #0284c7; color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: bold;">
              ${pronto ? "Baixar documento traduzido" : "Ver minha tradução"}
            </a>
          </p>
          <p style="color: #71717a; font-size: 12px;">Se você não pediu essa tradução, pode ignorar este e-mail.</p>
        </div>
      `,
    });
    if (error) {
      return NextResponse.json({ erro: error.message }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json({ erro: String(err instanceof Error ? err.message : err) }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
