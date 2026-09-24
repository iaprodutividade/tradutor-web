// Estados de job a partir dos quais é válido cobrar: o fluxo de texto/DOCX
// nasce direto em "aguardando_pagamento" (default da tabela), mas o fluxo de
// PDF-imagem passa antes por "aguardando_previa_imagem" -> "gerando_previa_imagem"
// -> "previa_imagem_pronta" (só sabe o preço real depois de processar a prévia).
// Sem essa segunda opção aqui, nenhum pagamento do fluxo de imagem completa.
export const STATUS_PRONTO_PARA_PAGAR = ["aguardando_pagamento", "previa_imagem_pronta"] as const;

export function estaProntoParaPagar(status: string): boolean {
  return (STATUS_PRONTO_PARA_PAGAR as readonly string[]).includes(status);
}
