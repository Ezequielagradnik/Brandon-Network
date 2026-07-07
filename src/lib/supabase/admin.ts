import { createClient } from "@supabase/supabase-js";

// Cliente con service role: omite RLS. Usar SOLO en el servidor
// (jobs, sync). Nunca exponer la service role key al cliente.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
