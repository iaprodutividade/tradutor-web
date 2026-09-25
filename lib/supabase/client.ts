import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Client com a publishable key — seguro no navegador (mesmo esquema
// publishable/secret do admin.ts). Usado só pra subir o arquivo original
// direto pro Storage via URL assinada (upload NUNCA passa pelo Vercel,
// que tem limite fixo de ~4,5MB por requisição de função serverless —
// bem menor que o limite de 15MB do próprio app, descoberto testando um
// catálogo real de 11MB em 25/09/2026). A URL assinada em si já autoriza
// o upload nesse caminho específico, então essa key não precisa de
// permissão nenhuma de escrita no bucket.
export function createBrowserClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// Duplicado de admin.ts (não dá pra importar de lá — tem "server-only" e
// quebraria em componente de cliente) em vez de um terceiro arquivo só pra
// uma constante.
export const BUCKET_ARQUIVOS = "tradutor-arquivos";
