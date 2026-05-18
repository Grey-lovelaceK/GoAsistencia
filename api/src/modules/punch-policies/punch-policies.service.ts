import { query, dbError } from "../../config/db";

interface DbPolitica {
  id: string;
  empresa_id: string;
  sitio_id: string | null;
  role: string;
  canal_permitido: string;
  requiere_geofence: boolean;
  requiere_biometria: boolean;
  requiere_foto: boolean;
  tolerancia_atraso_min: number;
}

function mapPolitica(row: DbPolitica) {
  return {
    id: row.id,
    empresaId: row.empresa_id,
    sitioId: row.sitio_id,
    role: row.role,
    canalPermitido: row.canal_permitido,
    requiereGeofence: row.requiere_geofence,
    requiereBiometria: row.requiere_biometria,
    requiereFoto: row.requiere_foto,
    toleranciaAtrasoMin: row.tolerancia_atraso_min,
  };
}

const SELECT = `
  SELECT id, empresa_id, sitio_id, role, canal_permitido,
         requiere_geofence, requiere_biometria, requiere_foto, tolerancia_atraso_min
  FROM politicas_marcacion
`;

export async function getPunchPolicies(empresaId: string, siteId?: string | null) {
  let sql: string;
  let params: unknown[];

  if (siteId) {
    // Políticas del sitio específico + globales (sitio_id IS NULL)
    sql = `${SELECT} WHERE empresa_id = $1 AND (sitio_id = $2 OR sitio_id IS NULL) ORDER BY role`;
    params = [empresaId, siteId];
  } else {
    sql = `${SELECT} WHERE empresa_id = $1 ORDER BY role`;
    params = [empresaId];
  }

  const rows = await query<DbPolitica>(sql, params)
    .catch((err: unknown) => dbError(err, "getPunchPolicies"));
  return { politicas: rows.map(mapPolitica) };
}
