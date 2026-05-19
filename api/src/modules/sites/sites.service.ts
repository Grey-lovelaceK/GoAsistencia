import { query, queryOne, dbError } from "../../config/db";
import { Errors } from "../../utils/errors";

interface DbSite {
  id: string;
  empresa_id: string;
  empresa_nombre: string;
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
  return {
    id: row.id,
    empresaId: row.empresa_id,
    empresaName: row.empresa_nombre ?? "",
    name: row.nombre,
    address: row.direccion ?? "",
    lat: parseFloat(String(row.lat)),
    lng: parseFloat(String(row.lng)),
    radiusMeters: parseInt(String(row.radio_metros), 10),
    timezone: row.timezone ?? "America/Santiago",
    active: Boolean(row.activo),
  };
}

const FULL_SELECT = `
  SELECT s.id, s.empresa_id, COALESCE(e.nombre,'') AS empresa_nombre,
         s.nombre, s.direccion, s.lat, s.lng, s.radio_metros, s.timezone, s.activo
  FROM sitios s
  JOIN empresas e ON e.id = s.empresa_id
`;

export async function getSites(empresaId: string | null) {
  const rows = empresaId
    ? await query<DbSite>(`${FULL_SELECT} WHERE s.empresa_id = $1 ORDER BY s.nombre`, [empresaId])
        .catch((err: unknown) => dbError(err, "getSites"))
    : await query<DbSite>(`${FULL_SELECT} ORDER BY e.nombre, s.nombre`, [])
        .catch((err: unknown) => dbError(err, "getSites"));
  return { sites: rows.map(mapSite) };
}

export async function getSite(id: string, empresaId: string) {
  const row = await queryOne<DbSite>(
    `${FULL_SELECT} WHERE s.id = $1 AND s.empresa_id = $2`, [id, empresaId]
  ).catch((err: unknown) => dbError(err, "getSite"));
  if (!row) throw Errors.notFound("Sitio no encontrado");
  return mapSite(row);
}

async function getSiteById(id: string): Promise<ReturnType<typeof mapSite>> {
  const row = await queryOne<DbSite>(
    `${FULL_SELECT} WHERE s.id = $1`, [id]
  ).catch((err: unknown) => dbError(err, "getSiteById"));
  if (!row) throw Errors.notFound("Sitio no encontrado");
  return mapSite(row);
}

export async function createSite(empresaId: string, data: CreateSiteData) {
  const inserted = await queryOne<{ id: string }>(
    `INSERT INTO sitios (empresa_id, nombre, direccion, lat, lng, radio_metros, timezone, activo)
     VALUES ($1, $2, $3, $4, $5, $6, $7, true)
     RETURNING id`,
    [empresaId, data.name, data.address, data.lat, data.lng, data.radiusMeters, data.timezone ?? "America/Santiago"]
  ).catch((err: unknown) => dbError(err, "createSite"));
  if (!inserted) throw Errors.internal("No se pudo crear el sitio");
  return getSiteById(inserted.id);
}

export async function updateSite(id: string, empresaId: string | null, data: UpdateSiteData) {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (data.name         !== undefined) { fields.push(`nombre = $${idx++}`);       values.push(data.name);         }
  if (data.address      !== undefined) { fields.push(`direccion = $${idx++}`);    values.push(data.address);      }
  if (data.lat          !== undefined) { fields.push(`lat = $${idx++}`);          values.push(data.lat);          }
  if (data.lng          !== undefined) { fields.push(`lng = $${idx++}`);          values.push(data.lng);          }
  if (data.radiusMeters !== undefined) { fields.push(`radio_metros = $${idx++}`); values.push(data.radiusMeters); }
  if (data.timezone     !== undefined) { fields.push(`timezone = $${idx++}`);     values.push(data.timezone);     }
  if (data.active       !== undefined) { fields.push(`activo = $${idx++}`);       values.push(data.active);       }

  if (fields.length === 0) throw Errors.badRequest("Nada que actualizar");

  const whereClause = empresaId
    ? `id = $${idx++} AND empresa_id = $${idx++}`
    : `id = $${idx++}`;
  if (empresaId) {
    values.push(id, empresaId);
  } else {
    values.push(id);
  }

  const updated = await queryOne<{ id: string }>(
    `UPDATE sitios SET ${fields.join(", ")} WHERE ${whereClause} RETURNING id`,
    values
  ).catch((err: unknown) => dbError(err, "updateSite"));
  if (!updated) throw Errors.notFound("Sitio no encontrado");
  return getSiteById(updated.id);
}
