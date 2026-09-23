-- Custo real de IA gasto em cada job (tokens de entrada + saida da OpenAI,
-- convertidos pra centavos de real) — grava mesmo em job com erro, porque os
-- tokens ja gastos ate a falha sao custo de verdade. Usado pra calcular
-- lucro real (preco cobrado - custo de IA) no dashboard do Hub. Vale so
-- pra jobs processados a partir de quando essa coluna existir.
alter table jobs add column custo_ia_centavos int;
