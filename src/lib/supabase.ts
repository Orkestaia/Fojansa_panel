import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cliente: SupabaseClient | null = null;

/**
 * Cliente con `service_role` (salta RLS). Las tablas `fojansa_*` tienen RLS activo y ninguna
 * política, así que esta es la única forma de leerlas (spec cabecera). Solo servidor: `server-only`
 * rompe el build si algún componente cliente lo importa. Nunca en `NEXT_PUBLIC_*`.
 */
export function supabaseAdmin(): SupabaseClient {
  if (cliente) return cliente;
  const url = process.env.SUPABASE_URL;
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !clave) {
    throw new Error("Supabase no configurado (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  }
  cliente = createClient(url, clave, { auth: { persistSession: false, autoRefreshToken: false } });
  return cliente;
}

export const TABLAS = {
  avisos: "fojansa_avisos",
  contactos: "fojansa_contactos",
  comunidades: "fojansa_comunidades",
  partes: "fojansa_partes",
} as const;
