const get = (key: string, fallback?: string): string => {
  const val = process.env[key];
  if (val !== undefined && val !== "") return val;
  if (fallback !== undefined) return fallback;
  throw new Error(`Variable de entorno requerida no definida: ${key}`);
};

export const env = {
  PORT:                      parseInt(get("PORT", "3001"), 10),
  NODE_ENV:                  get("NODE_ENV", "development"),
  DATABASE_URL:              get("DATABASE_URL"),
  // Supabase Client — opcional, solo para integraciones futuras (Storage, Auth, etc.)
  SUPABASE_URL:              get("SUPABASE_URL", ""),
  SUPABASE_SERVICE_ROLE_KEY: get("SUPABASE_SERVICE_ROLE_KEY", ""),
  JWT_ACCESS_SECRET:         get("JWT_ACCESS_SECRET", "dev_access_secret_change_me_in_production"),
  JWT_REFRESH_SECRET:        get("JWT_REFRESH_SECRET", "dev_refresh_secret_change_me_in_production"),
  JWT_ACCESS_EXPIRES_IN:     get("JWT_ACCESS_EXPIRES_IN", "15m"),
  JWT_REFRESH_EXPIRES_IN:    get("JWT_REFRESH_EXPIRES_IN", "7d"),
  CORS_ORIGIN:               get("CORS_ORIGIN", "http://localhost:5173"),
} as const;
