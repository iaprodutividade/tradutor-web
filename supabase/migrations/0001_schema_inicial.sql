-- Jobs de traducao: criado quando a pessoa pede a previa gratis (guarda o
-- arquivo original pra nao precisar re-upload na hora de pagar), atualizado
-- pra "pago" pelo webhook do Mercado Pago, e pra "pronto" depois que o
-- backend processa o documento inteiro.
create table jobs (
  id uuid primary key default gen_random_uuid(),
  criado_em timestamptz not null default now(),
  tipo_arquivo text not null check (tipo_arquivo in ('pdf', 'docx')),
  nome_arquivo text not null,
  idioma_origem text not null,
  idioma_destino text not null,
  converter_unidades boolean not null default false,
  paginas_total int not null,
  preco_centavos int not null,
  arquivo_original_path text not null,
  arquivo_traduzido_path text,
  status text not null default 'aguardando_pagamento'
    check (status in ('aguardando_pagamento', 'pago', 'processando', 'pronto', 'erro')),
  erro_mensagem text,
  ip_cliente text
);

create table pagamentos (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs (id) on delete cascade,
  provider_payment_id text not null unique,
  provedor text not null default 'mercadopago',
  metodo text not null check (metodo in ('pix', 'cartao')),
  parcelas int,
  valor_centavos int not null,
  status text not null,
  criado_em timestamptz not null default now(),
  pago_em timestamptz
);

create index pagamentos_job_id_idx on pagamentos (job_id);

alter table jobs enable row level security;
alter table pagamentos enable row level security;
-- Sem policies de leitura publica de proposito: todo acesso passa pelo
-- backend (Next.js API routes / tradutor-api) usando a service role key,
-- nunca direto do navegador.
