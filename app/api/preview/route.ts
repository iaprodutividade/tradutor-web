import "server-only";
import { NextRequest, NextResponse } from "next/server";

// Repassa o upload pro backend (tradutor-api na VPS Andrea) incluindo a
// chave de API secreta, que nunca deve chegar ao navegador do cliente.
export async function POST(req: NextRequest) {
  const formData = await req.formData();

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
  return NextResponse.json(data, { status: resp.status });
}
