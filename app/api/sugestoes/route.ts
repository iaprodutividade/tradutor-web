import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Caixinha de sugestão/reclamação do site público. E-mail é obrigatório pra
// dar pro Robson como responder — sem login, sem conta, só isso.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const mensagem = typeof body?.mensagem === "string" ? body.mensagem.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const nome = typeof body?.nome === "string" ? body.nome.trim() : null;

  if (!mensagem) {
    return NextResponse.json({ erro: "Escreva sua sugestão ou o que está acontecendo." }, { status: 400 });
  }
  if (!email || !email.includes("@")) {
    return NextResponse.json({ erro: "Informe um e-mail válido pra podermos responder." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("sugestoes").insert({ mensagem, email, nome });
  if (error) {
    return NextResponse.json({ erro: `Não deu pra enviar: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
