-- Dados adicionais sobre quem pagou e quanto realmente chegou, sem pedir
-- nada novo no checkout (zero atrito extra) e sem guardar dado sensível
-- (CPF fora do escopo, por decisão do Robson em 2026-09-21):
--
-- - payer_email: só existe pra cartão (o Mercado Pago já exige e-mail pra
--   tokenizar o cartão — o dado já é coletado hoje, só não era salvo).
--   Pix não pede e-mail de verdade (usa um sintético só pra API aceitar a
--   cobrança) e o Mercado Pago MASCARA o e-mail do pagador na consulta do
--   pagamento ("XXXXXXXXXXX") — não tem como recuperar isso pro pix.
-- - payer_bank_nome: só existe pra pix — o Mercado Pago devolve o banco de
--   origem da transferência (point_of_interaction.transaction_data.bank_info
--   .payer.long_name, ex: "BANCO C6 S.A.") de graça na consulta do
--   pagamento, sem pedir nada no checkout. Nome/CPF do pagador em si vêm
--   nulos nessa consulta (não expostos pelo Mercado Pago nessa integração).
-- - valor_liquido_centavos: quanto realmente caiu na conta depois da taxa
--   do Mercado Pago (transaction_details.net_received_amount) — útil pra
--   bater com o valor bruto cobrado (preco_centavos).
--
-- Vale só para pagamentos novos a partir de quando essas colunas existirem.
alter table pagamentos add column payer_email text;
alter table pagamentos add column payer_bank_nome text;
alter table pagamentos add column valor_liquido_centavos int;
