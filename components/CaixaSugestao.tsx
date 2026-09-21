"use client";

import { useState } from "react";
import { MessageSquarePlus, Send, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui";
import { AcaoPill } from "@/components/AcaoTile";

export function CaixaSugestao() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      const resp = await fetch("/api/sugestoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome || null, email, mensagem }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.erro ?? "Não deu pra enviar. Tenta de novo.");
      setEnviado(true);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <Card className="mx-auto max-w-xl text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-[var(--accent-success)]" />
        <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">Recebemos sua mensagem!</p>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Obrigado pelo retorno — se precisar de resposta, a gente entra em contato pelo e-mail que você deixou.
        </p>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-xl">
      <div className="flex items-center gap-2">
        <MessageSquarePlus className="h-5 w-5 text-[var(--accent-info)]" />
        <p className="text-sm font-semibold text-[var(--text-primary)]">Sugestão ou algo não funcionou?</p>
      </div>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        Conta pra gente o que você gostaria de ver aqui, ou descreve o problema que encontrou.
      </p>

      <form onSubmit={enviar} className="mt-4 space-y-3">
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Seu nome (opcional)"
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-sky-500/60"
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Seu e-mail, pra podermos responder"
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-sky-500/60"
        />
        <textarea
          required
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          placeholder="Sua sugestão ou o que aconteceu..."
          rows={4}
          className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-sky-500/60"
        />

        {erro && <p className="text-sm text-[var(--accent-danger)]">{erro}</p>}

        <div className="flex justify-center pt-1">
          <button type="submit" disabled={enviando} className="group w-full sm:w-auto">
            <AcaoPill
              cor="azul"
              label={enviando ? "Enviando..." : "Enviar"}
              icon={<Send className="h-4 w-4" />}
              pressionado={enviando}
              className="w-full justify-center sm:w-auto"
            />
          </button>
        </div>
      </form>
    </Card>
  );
}
