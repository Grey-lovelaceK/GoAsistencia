import { query, queryOne, dbError } from "../../config/db";
import { Errors } from "../../utils/errors";
import type {
  DbException,
  DbExceptionRow,
  ExceptionResponse,
  CreateExceptionData,
  UpdateExceptionData,
} from "./exceptions.types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapRow(row: DbExceptionRow): ExceptionResponse {
  return {
    id:           row.id,
    type:         row.tipo,
    title:        row.titulo,
    dateFrom:     row.fecha_desde,
    dateTo:       row.fecha_hasta,
    description:  row.descripcion ?? undefined,
    employeeId:   row.usuario_id,
    employeeName: row.usuario_nombre,
  };
}

// IDs de colaboradores supervisados por un supervisor (para filtros de permisos)
async function getSupervisadoIds(supervisorId: string, empresaId: string): Promise<string[]> {
  const rows = await query<{ id: string }>(
    `SELECT id FROM usuarios WHERE supervisor_id = $1 AND empresa_id = $2 AND activo = true`,
    [supervisorId, empresaId]
  ).catch((err: unknown) => dbError(err, "exceptions.getSupervisadoIds"));
  return rows.map((r) => r.id);
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export async function getExceptionById(id: string, empresaId: string): Promise<DbException | null> {
  return queryOne<DbException>(
    `SELECT id, empresa_id, usuario_id, tipo, titulo, fecha_desde, fecha_hasta, descripcion, created_at, updated_at
     FROM excepciones WHERE id = $1 AND empresa_id = $2`,
    [id, empresaId]
  ).catch((err: unknown) => dbError(err, "exceptions.getById"));
}

export async function assertSupervisorScope(
  exception: DbException,
  supervisorId: string,
  empresaId: string
): Promise<void> {
  // Excepción sin usuario asignado (feriado global): supervisor puede gestionarla
  if (!exception.usuario_id) return;

  const ids = await getSupervisadoIds(supervisorId, empresaId);
  if (!ids.includes(exception.usuario_id)) {
    throw Errors.forbidden("No tienes permiso para gestionar excepciones de este colaborador");
  }
}

export async function getExceptions(
  empresaId: string,
  opts: {
    supervisorId?: string;
    type?: string;
    year?: number;
    month?: number;
    employeeId?: string;
  } = {}
): Promise<{ exceptions: ExceptionResponse[] }> {
  const conditions: string[] = [];
  const vals: unknown[] = [];

  conditions.push(`e.empresa_id = $${vals.push(empresaId)}`);

  if (opts.type)       conditions.push(`e.tipo = $${vals.push(opts.type)}`);
  if (opts.employeeId) conditions.push(`e.usuario_id = $${vals.push(opts.employeeId)}`);

  // Filtro por mes — excepciones que se solapan con el mes solicitado
  if (opts.year && opts.month) {
    const firstDay = `${opts.year}-${String(opts.month).padStart(2, "0")}-01`;
    const lastDay  = new Date(opts.year, opts.month, 0).toISOString().split("T")[0];
    conditions.push(`e.fecha_desde <= $${vals.push(lastDay)}`);
    conditions.push(`e.fecha_hasta >= $${vals.push(firstDay)}`);
  }

  // Supervisor: ve las de sus supervisados + las globales (usuario_id IS NULL)
  if (opts.supervisorId) {
    const ids = await getSupervisadoIds(opts.supervisorId, empresaId);
    conditions.push(`(e.usuario_id IS NULL OR e.usuario_id = ANY($${vals.push(ids)}))`);
  }

  const rows = await query<DbExceptionRow>(
    `SELECT e.id, e.empresa_id, e.usuario_id, e.tipo, e.titulo,
            e.fecha_desde, e.fecha_hasta, e.descripcion, e.created_at, e.updated_at,
            u.nombre AS usuario_nombre
     FROM excepciones e
     LEFT JOIN usuarios u ON u.id = e.usuario_id AND u.empresa_id = e.empresa_id
     WHERE ${conditions.join(" AND ")}
     ORDER BY e.fecha_desde ASC`,
    vals
  ).catch((err: unknown) => dbError(err, "getExceptions.query"));

  return { exceptions: rows.map(mapRow) };
}

export async function createException(
  data: CreateExceptionData,
  empresaId: string
): Promise<ExceptionResponse> {
  const rows = await query<DbException>(
    `INSERT INTO excepciones
       (empresa_id, usuario_id, tipo, titulo, fecha_desde, fecha_hasta, descripcion)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, empresa_id, usuario_id, tipo, titulo, fecha_desde, fecha_hasta,
               descripcion, created_at, updated_at`,
    [
      empresaId,
      data.employeeId ?? null,
      data.type,
      data.title,
      data.dateFrom,
      data.dateTo,
      data.description ?? null,
    ]
  ).catch((err: unknown) => dbError(err, "createException.insert"));

  const row = rows[0];

  // Resolver nombre del empleado si se asignó usuario_id
  let employeeName: string | null = null;
  if (row.usuario_id) {
    const emp = await queryOne<{ nombre: string }>(
      `SELECT nombre FROM usuarios WHERE id = $1 AND empresa_id = $2`,
      [row.usuario_id, empresaId]
    ).catch((err: unknown) => dbError(err, "createException.getEmployee"));
    employeeName = emp?.nombre ?? null;
  }

  return {
    id:           row.id,
    type:         row.tipo,
    title:        row.titulo,
    dateFrom:     row.fecha_desde,
    dateTo:       row.fecha_hasta,
    description:  row.descripcion ?? undefined,
    employeeId:   row.usuario_id,
    employeeName,
  };
}

export async function updateException(
  id: string,
  empresaId: string,
  data: UpdateExceptionData
): Promise<{ id: string; updated: boolean }> {
  const found = await getExceptionById(id, empresaId);
  if (!found) throw Errors.notFound("Excepción no encontrada");

  const sets: string[] = [];
  const vals: unknown[] = [];

  if (data.type        !== undefined) sets.push(`tipo        = $${vals.push(data.type)}`);
  if (data.employeeId  !== undefined) sets.push(`usuario_id  = $${vals.push(data.employeeId ?? null)}`);
  if (data.title       !== undefined) sets.push(`titulo      = $${vals.push(data.title)}`);
  if (data.dateFrom    !== undefined) sets.push(`fecha_desde = $${vals.push(data.dateFrom)}`);
  if (data.dateTo      !== undefined) sets.push(`fecha_hasta = $${vals.push(data.dateTo)}`);
  if (data.description !== undefined) sets.push(`descripcion = $${vals.push(data.description || null)}`);

  if (sets.length > 0) {
    sets.push("updated_at = now()");
    const idIdx  = vals.push(id);
    const eidIdx = vals.push(empresaId);

    await query(
      `UPDATE excepciones SET ${sets.join(", ")} WHERE id = $${idIdx} AND empresa_id = $${eidIdx}`,
      vals
    ).catch((err: unknown) => dbError(err, "updateException.update"));
  }

  return { id, updated: true };
}

export async function deleteException(
  id: string,
  empresaId: string
): Promise<{ id: string; deleted: boolean }> {
  const found = await getExceptionById(id, empresaId);
  if (!found) throw Errors.notFound("Excepción no encontrada");

  await query(
    `DELETE FROM excepciones WHERE id = $1 AND empresa_id = $2`,
    [id, empresaId]
  ).catch((err: unknown) => dbError(err, "deleteException.delete"));

  return { id, deleted: true };
}
