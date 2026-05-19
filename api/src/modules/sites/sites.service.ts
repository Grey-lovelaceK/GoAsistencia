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

interface DbShift {
  id: string;
  nombre: string;
  hora_inicio: string;
  hora_fin: string;
  minutos_colacion: number;
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

export interface CreateShiftData {
  name: string;
  start: string;
  end: string;
  breakMinutes: number;
}

export interface UpdateShiftData {
  name?: string;
  start?: string;
  end?: string;
  breakMinutes?: number;
}

function mapShift(t: DbShift) {
  return {
    id:           t.id,
    name:         t.nombre,
    start:        t.hora_inicio.slice(0, 5),
    end:          t.hora_fin.slice(0, 5),
    breakMinutes: t.minutos_colacion,
  };
}

function mapSite(row: DbSite, shifts: DbShift[] = []) {
  return {
    id:           row.id,
    empresaId:    row.empresa_id,
    empresaName:  row.empresa_nombre ?? "",
    name:         row.nombre,
    address:      row.direccion ?? "",
    lat:          parseFloat(String(row.lat)),
    lng:          parseFloat(String(row.lng)),
    radiusMeters: parseInt(String(row.radio_metros), 10),
    timezone:     row.timezone ?? "America/Santiago",
    active:       Boolean(row.activo),
    shifts:       shifts.map(mapShift),
  };
}

const FULL_SELECT = `
  SELECT s.id, s.empresa_id, COALESCE(e.nombre,'') AS empresa_nombre,
         s.nombre, s.direccion, s.lat, s.lng, s.radio_metros, s.timezone, s.activo
  FROM sitios s
  LEFT JOIN empresas e ON e.id = s.empresa_id
`;

async function getShiftsForSite(siteId: string): Promise<DbShift[]> {
  return query<DbShift>(
    `SELECT id, nombre, hora_inicio, hora_fin, minutos_colacion FROM turnos WHERE sitio_id = $1 ORDER BY hora_inicio`,
    [siteId]
  ).catch((err: unknown) => dbError(err, "getShiftsForSite"));
}

export async function getSites(empresaId: string | null) {
  const rows = empresaId
    ? await query<DbSite>(`${FULL_SELECT} WHERE s.empresa_id = $1 ORDER BY s.nombre`, [empresaId])
        .catch((err: unknown) => dbError(err, "getSites"))
    : await query<DbSite>(`${FULL_SELECT} ORDER BY e.nombre, s.nombre`, [])
        .catch((err: unknown) => dbError(err, "getSites"));
  return { sites: rows.map((r) => mapSite(r)) };
}

export async function getSite(id: string, empresaId: string | null) {
  const row = empresaId
    ? await queryOne<DbSite>(`${FULL_SELECT} WHERE s.id = $1 AND s.empresa_id = $2`, [id, empresaId])
        .catch((err: unknown) => dbError(err, "getSite"))
    : await queryOne<DbSite>(`${FULL_SELECT} WHERE s.id = $1`, [id])
        .catch((err: unknown) => dbError(err, "getSite"));
  if (!row) throw Errors.notFound("Sitio no encontrado");
  const shifts = await getShiftsForSite(row.id);
  return mapSite(row, shifts);
}

export async function createSite(empresaId: string, data: CreateSiteData) {
  const inserted = await queryOne<{ id: string }>(
    `INSERT INTO sitios (empresa_id, nombre, direccion, lat, lng, radio_metros, timezone, activo)
     VALUES ($1, $2, $3, $4, $5, $6, $7, true)
     RETURNING id`,
    [empresaId, data.name, data.address, data.lat, data.lng, data.radiusMeters, data.timezone ?? "America/Santiago"]
  ).catch((err: unknown) => dbError(err, "createSite"));
  if (!inserted) throw Errors.internal("No se pudo crear el sitio");
  return getSite(inserted.id, empresaId);
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
  return getSite(updated.id, empresaId);
}

// ─── Shifts ──────────────────────────────────────────────────────────────────

export async function createShift(siteId: string, empresaId: string, data: CreateShiftData) {
  const row = await queryOne<DbShift>(
    `INSERT INTO turnos (empresa_id, sitio_id, nombre, hora_inicio, hora_fin, minutos_colacion)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, nombre, hora_inicio, hora_fin, minutos_colacion`,
    [empresaId, siteId, data.name, data.start, data.end, data.breakMinutes]
  ).catch((err: unknown) => dbError(err, "createShift"));
  if (!row) throw Errors.internal("No se pudo crear el turno");
  return mapShift(row);
}

export async function updateShift(shiftId: string, siteId: string, empresaId: string | null, data: UpdateShiftData) {
  const fields: string[] = [];
  const values: unknown[] = [shiftId, siteId];
  let idx = 3;

  if (data.name         !== undefined) { fields.push(`nombre = $${idx++}`);           values.push(data.name);         }
  if (data.start        !== undefined) { fields.push(`hora_inicio = $${idx++}`);      values.push(data.start);        }
  if (data.end          !== undefined) { fields.push(`hora_fin = $${idx++}`);         values.push(data.end);          }
  if (data.breakMinutes !== undefined) { fields.push(`minutos_colacion = $${idx++}`); values.push(data.breakMinutes); }

  if (fields.length === 0) throw Errors.badRequest("Nada que actualizar");

  const extraWhere = empresaId ? ` AND empresa_id = $${idx++}` : "";
  if (empresaId) values.push(empresaId);

  const row = await queryOne<DbShift>(
    `UPDATE turnos SET ${fields.join(", ")} WHERE id = $1 AND sitio_id = $2${extraWhere}
     RETURNING id, nombre, hora_inicio, hora_fin, minutos_colacion`,
    values
  ).catch((err: unknown) => dbError(err, "updateShift"));
  if (!row) throw Errors.notFound("Turno no encontrado");
  return mapShift(row);
}

export async function deleteShift(shiftId: string, siteId: string, empresaId: string | null) {
  const extraWhere = empresaId ? ` AND empresa_id = $3` : "";
  const values: unknown[] = empresaId ? [shiftId, siteId, empresaId] : [shiftId, siteId];
  const row = await queryOne<{ id: string }>(
    `DELETE FROM turnos WHERE id = $1 AND sitio_id = $2${extraWhere} RETURNING id`,
    values
  ).catch((err: unknown) => dbError(err, "deleteShift"));
  if (!row) throw Errors.notFound("Turno no encontrado");
}
