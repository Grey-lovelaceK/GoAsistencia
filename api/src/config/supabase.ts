// FASE 2.5 — temporal: Supabase Client vía HTTPS en lugar de pg directo.
// Reemplazar por conexión directa pg cuando se resuelva el problema IPv6/DNS con Supabase.
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Errors } from "../utils/errors";

let _client: SupabaseClient | null = null;

function buildClient(): SupabaseClient {
  const url  = process.env.SUPABASE_URL;
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos. " +
      "Crea un archivo api/.env basado en api/.env.example y configura los valores."
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession:   false,
    },
  });
}

export function getSupabaseClient(): SupabaseClient {
  if (!_client) _client = buildClient();
  return _client;
}

export function dbError(error: unknown, context: string): never {
  console.error(`[Supabase] Error en ${context}:`, error);
  throw Errors.internal("Error en base de datos");
}
