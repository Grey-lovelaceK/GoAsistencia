import { Pool, PoolClient } from "pg";
import { env } from "./env";
import { Errors } from "../utils/errors";

let pool: Pool | null = null;

function createPool(): Pool {
  if (!env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL no está configurado. Crea un archivo .env con tus credenciales de Supabase."
    );
  }
  const isLocal =
    env.DATABASE_URL.includes("localhost") ||
    env.DATABASE_URL.includes("127.0.0.1");

  return new Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });
}

export function getPool(): Pool {
  if (!pool) {
    pool = createPool();
    pool.on("error", (err) => {
      console.error("[pg] Error inesperado en cliente idle:", err.message);
    });
  }
  return pool;
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const { rows } = await getPool().query(sql, params);
  return rows as T[];
}

export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export function dbError(error: unknown, context: string): never {
  console.error(`[pg] Error en ${context}:`, error);
  throw Errors.internal("Error en base de datos");
}
