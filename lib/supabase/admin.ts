import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Client com a secret key — só pode rodar em Server Components/Route Handlers,
// nunca no navegador. Projeto novo (criado 20/09/2026) já usa o esquema novo
// de chaves do Supabase (publishable/secret), não o antigo anon/service_role.
export function createAdminClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false },
  });
}

export const BUCKET_ARQUIVOS = "tradutor-arquivos";
