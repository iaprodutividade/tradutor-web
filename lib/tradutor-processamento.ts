import "server-only";

// Entrega o job pro backend (VPS Andrea) e espera a confirmação de
// recebimento (202) — o processamento em si roda em background lá, pode
// levar minutos num documento grande, e uma função serverless não
// aguentaria esperar isso. Usado tanto pelo webhook do Mercado Pago quanto
// pelo resgate de cupom 100% (que pula o pagamento de verdade).
export async function dispararProcessamentoCompleto(jobId: string) {
  const apiUrl = process.env.TRADUTOR_API_URL;
  const apiKey = process.env.TRADUTOR_API_KEY;
  if (!apiUrl || !apiKey) throw new Error("Backend não configurado (TRADUTOR_API_URL/TRADUTOR_API_KEY).");

  const resp = await fetch(`${apiUrl}/traduzir-completo`, {
    method: "POST",
    headers: { "X-Api-Key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ job_id: jobId }),
  });
  if (!resp.ok) {
    const texto = await resp.text();
    throw new Error(`Backend /traduzir-completo recusou o job ${jobId} (${resp.status}): ${texto.slice(0, 300)}`);
  }
}
