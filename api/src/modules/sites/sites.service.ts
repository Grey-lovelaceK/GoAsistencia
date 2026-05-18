import { query, queryOne, dbError } from "../../config/db";
import { Errors } from "../../utils/errors";

interface DbSite {
  id: string;
  empresa_id: string;
  nombre: string;
  direccion: string;
  lat: number;
  lng: number;
  radio_metros: number;
  timezone: string;
  activo: boolean;
}

export interface CreateSiteData {
  name: string;
  address: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  timezone?: string;
}

export interface UpdateSiteData {
  name?: string;
  address?: string;
  lat?: number;
  lng?: number;
  radiusMeters?: number;
  timezone?: string;
  active?: boolean;
}

function mapSite(row: DbSite) {
  // pg returns NUMERIC/DECIMAL columns as strings — coerce explicitly
  return {
    id: row.id,
    empresaId: row.empresa_id,
    name: row.nombre,
    address: row.direccion ?? "",
    lat: parseFloat(String(row.lat)),
    lng: parseFloat(String(row.lng)),
    radiusMeters: parseInt(String(row.radio_metros), 10),
    timezone: row.timezone ?? "America/Santiago",
    active: Boolean(row.activo),
  };
}

const COLS = `id, empresa_id, nombre, direccion, lat, lng, radio_metros, timezone, activo`;
const SQL  = `SELECT ${COLS} FROM sitios`;

export async function getSites(empresaId: string) {
  const rows = await query<DbSite>(`${SQL} WHERE empresa_id = $1 ORDER BY nombre`, [empresaId])
    .catch((err: unknown) => dbError(err, "getSites"));
  return { sites: rows.map(mapSite) };
}

export async function getSite(id: string, empresaId: string) {
  const row = await queryOne<DbSite>(`${SQL} WHERE id = $1 AND empresa_id = $2`, [id, empresaId])
    .catch((err: unknown) => dbError(err, "getSite"));
  if (!row) throw Errors.notFound("Sitio no encontrado");
  return mapSite(row);
}

export async function createSite(empresaId: string, data: CreateSiteData) {
  const row = await queryOne<DbSite>(
    `INSERT INTO sitios (empresa_id, nombre, direccion, lat, lng, radio_metros, timezone, activo)
     VALUES ($1, $2, $3, $4, $5, $6, $7, true)
     RETURNING ${COLS}`,
    [empresaId, data.name, data.address, data.lat, data.lng, data.radiusMeters, data.timezone ?? "America/Santiago"]
  ).catch((err: unknown) => dbError(err, "createSite"));
  if (!row) throw Errors.internal("No se pudo crear el sitio");
  return mapSite(row);
}

export async function updateSite(id: string, empresaId: string, data: UpdateSiteData) {
  const fields: string[] = [];
  const values: unknown[] = [id, empresaId];
  let idx = 3;

  if (data.name         !== undefined) { fields.push(`nombre = $${idx++}`);       values.push(data.name);         }
  if (data.address      !== undefined) { fields.push(`direccion = $${idx++}`);    values.push(data.address);      }
  if (data.lat          !== undefined) { fields.push(`lat = $${idx++}`);          values.push(data.lat);          }
  if (data.lng          !== undefined) { fields.push(`lng = $${idx++}`);          values.push(data.lng);          }
  if (data.radiusMeters !== undefined) { fields.push(`radio_metros = $${idx++}`); values.push(data.radiusMeters); }
  if (data.timezone     !== undefined) { fields.push(`timezone = $${idx++}`);     values.push(data.timezone);     }
  if (data.active       !== undefined) { fields.push(`activo = $${idx++}`);       values.push(data.active);       }

  if (fields.length === 0) throw Errors.badRequest("Nada que actualizar");

  const row = await queryOne<DbSite>(
    `UPDATE sitios SET ${fields.join(", ")} WHERE id = $1 AND empresa_id = $2
     RETURNING ${COLS}`,
    values
  ).catch((err: unknown) => dbError(err, "updateSite"));
  if (!row) throw Errors.notFound("Sitio no encontrado");
  return mapSite(row);
}
