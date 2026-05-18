import bcrypt from "bcryptjs";
import { query, queryOne, dbError } from "../../config/db";
import { Errors } from "../../utils/errors";

interface DbUsuario {
  id: string;
  empresa_id: string;
  rut: string;
  nombre: string;
  email: string;
  role: string;
  sitio_id: string | null;
  supervisor_id: string | null;
  passkey_registrado: boolean;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

interface GrupoInfo {
  id: string;
  nombre: string;
  tipo: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getActiveGrupoTurnos(
  userIds: string[],
  empresaId: string
): Promise<Map<string, GrupoInfo | null>> {
  const result = new Map<string, GrupoInfo | null>();
  if (userIds.length === 0) return result;

  const today = new Date().toISOString().split("T")[0];

  const ugts = await query<{ usuario_id: string; grupo_turno_id: string }>(
    `SELECT usuario_id, grupo_turno_id, fecha_inicio
     FROM usuarios_grupos_turno
     WHERE usuario_id = ANY($1) AND empresa_id = $2
       AND (fecha_fin IS NULL OR fecha_fin >= $3)
     ORDER BY fecha_inicio DESC`,
    [userIds, empresaId, today]
  ).catch((err: unknown) => dbError(err, "getActiveGrupoTurnos.ugts"));

  // La más reciente por usuario (vienen DESC)
  const latestPerUser = new Map<string, string>();
  for (const ugt of ugts) {
    if (!latestPerUser.has(ugt.usuario_id)) {
      latestPerUser.set(ugt.usuario_id, ugt.grupo_turno_id);
    }
  }

  const grupoIds = [...latestPerUser.values()];
  if (grupoIds.length === 0) {
    for (const uid of userIds) result.set(uid, null);
    return result;
  }

  const grupos = await query<GrupoInfo>(
    `SELECT id, nombre, tipo FROM grupos_turno WHERE id = ANY($1) AND empresa_id = $2`,
    [grupoIds, empresaId]
  ).catch((err: unknown) => dbError(err, "getActiveGrupoTurnos.grupos"));

  const grupoMap = new Map(grupos.map((g) => [g.id, g]));

  for (const uid of userIds) {
    const gid = latestPerUser.get(uid);
    result.set(uid, gid ? (grupoMap.get(gid) ?? null) : null);
  }
  return result;
}

function mapEmployee(
  u: DbUsuario,
  siteNameMap: Map<string, string>,
  grupoMap: Map<string, GrupoInfo | null>
) {
  const grupo = grupoMap.get(u.id) ?? null;
  return {
    id:               u.id,
    empresaId:        u.empresa_id,
    rut:              u.rut,
    name:             u.nombre,
    email:            u.email,
    role:             u.role,
    siteId:           u.sitio_id,
    siteName:         u.sitio_id ? (siteNameMap.get(u.sitio_id) ?? null) : null,
    supervisorId:     u.supervisor_id,
    status:           u.activo ? "activo" : "inactivo",
    passkey:          u.passkey_registrado,
    grupoTurnoId:     grupo?.id     ?? null,
    grupoTurnoNombre: grupo?.nombre ?? null,
    grupoTurnoTipo:   grupo?.tipo   ?? null,
    createdAt:        u.created_at,
    updatedAt:        u.updated_at,
  };
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export async function getEmployees(params: {
  empresaId: string;
  supervisorId?: string;
  includeInactive?: boolean;
}) {
  const conditions: string[] = [];
  const vals: unknown[] = [];

  conditions.push(`empresa_id = $${vals.push(params.empresaId)}`);
  if (!params.includeInactive) conditions.push(`activo = true`);
  if (params.supervisorId) conditions.push(`supervisor_id = $${vals.push(params.supervisorId)}`);

  const rows = await query<DbUsuario>(
    `SELECT id, empresa_id, rut, nombre, email, role, sitio_id, supervisor_id,
            passkey_registrado, activo, created_at, updated_at
     FROM usuarios WHERE ${conditions.join(" AND ")} ORDER BY nombre`,
    vals
  ).catch((err: unknown) => dbError(err, "getEmployees.usuarios"));

  // Batch: nombres de sitios
  const siteIds = [...new Set(rows.filter((u) => u.sitio_id).map((u) => u.sitio_id as string))];
  const siteNameMap = new Map<string, string>();
  if (siteIds.length > 0) {
    const sitios = await query<{ id: string; nombre: string }>(
      `SELECT id, nombre FROM sitios WHERE id = ANY($1) AND empresa_id = $2`,
      [siteIds, params.empresaId]
    ).catch((err: unknown) => dbError(err, "getEmployees.sitios"));
    for (const s of sitios) siteNameMap.set(s.id, s.nombre);
  }

  // Batch: grupos de turno activos
  const grupoMap = await getActiveGrupoTurnos(rows.map((u) => u.id), params.empresaId);

  const employees = rows.map((u) => mapEmployee(u, siteNameMap, grupoMap));
  return { employees, total: employees.length };
}

export async function createEmployee(data: {
  empresaId: string;
  rut: string;
  name: string;
  email: string;
  password: string;
  role: string;
  siteId?: string | null;
  supervisorId?: string | null;
  grupoTurnoId?: string | null;
}) {
  const email = data.email.toLowerCase();

  const existing = await queryOne<{ id: string }>(
    `SELECT id FROM usuarios WHERE empresa_id = $1 AND (rut = $2 OR email = $3) LIMIT 1`,
    [data.empresaId, data.rut, email]
  ).catch((err: unknown) => dbError(err, "createEmployee.duplicate_check"));

  if (existing) throw Errors.conflict("Ya existe un usuario con ese RUT o email en esta empresa");

  const passwordHash = await bcrypt.hash(data.password, 12);

  const rows = await query<DbUsuario>(
    `INSERT INTO usuarios
       (empresa_id, rut, nombre, email, password_hash, role, sitio_id, supervisor_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, empresa_id, rut, nombre, email, role, sitio_id, supervisor_id,
               passkey_registrado, activo, created_at, updated_at`,
    [data.empresaId, data.rut, data.name, email, passwordHash, data.role, data.siteId ?? null, data.supervisorId ?? null]
  ).catch((err: unknown) => dbError(err, "createEmployee.insert"));

  const u = rows[0];

  // Asignar grupo de turno si viene
  if (data.grupoTurnoId) {
    const today = new Date().toISOString().split("T")[0];
    await query(
      `INSERT INTO usuarios_grupos_turno (usuario_id, empresa_id, grupo_turno_id, fecha_inicio)
       VALUES ($1, $2, $3, $4)`,
      [u.id, data.empresaId, data.grupoTurnoId, today]
    ).catch((err: unknown) => dbError(err, "createEmployee.usuarios_grupos_turno"));
  }

  return {
    id: u.id, empresaId: u.empresa_id, rut: u.rut, name: u.nombre, email: u.email,
    role: u.role, siteId: u.sitio_id, siteName: null,
    supervisorId: u.supervisor_id, status: u.activo ? "activo" : "inactivo",
    passkey: u.passkey_registrado,
    grupoTurnoId: data.grupoTurnoId ?? null, grupoTurnoNombre: null, grupoTurnoTipo: null,
    createdAt: u.created_at, updatedAt: u.updated_at,
  };
}

export async function updateEmployee(
  id: string,
  empresaId: string,
  data: {
    name?: string;
    email?: string;
    rut?: string;
    role?: string;
    siteId?: string | null;
    supervisorId?: string | null;
    status?: string;
    grupoTurnoId?: string | null;
  }
) {
  const found = await queryOne<{ id: string }>(
    `SELECT id FROM usuarios WHERE id = $1 AND empresa_id = $2`,
    [id, empresaId]
  ).catch((err: unknown) => dbError(err, "updateEmployee.find"));

  if (!found) throw Errors.notFound("Empleado no encontrado");

  const sets: string[] = [];
  const vals: unknown[] = [];

  if (data.name !== undefined)         sets.push(`nombre = $${vals.push(data.name)}`);
  if (data.email !== undefined)        sets.push(`email = $${vals.push(data.email.toLowerCase())}`);
  if (data.rut !== undefined)          sets.push(`rut = $${vals.push(data.rut)}`);
  if (data.role !== undefined)         sets.push(`role = $${vals.push(data.role)}`);
  if (data.siteId !== undefined)       sets.push(`sitio_id = $${vals.push(data.siteId)}`);
  if (data.supervisorId !== undefined) sets.push(`supervisor_id = $${vals.push(data.supervisorId)}`);
  if (data.status !== undefined)       sets.push(`activo = $${vals.push(data.status === "activo")}`);
  sets.push("updated_at = now()");

  const idIdx  = vals.push(id);
  const eidIdx = vals.push(empresaId);

  await query(
    `UPDATE usuarios SET ${sets.join(", ")} WHERE id = $${idIdx} AND empresa_id = $${eidIdx}`,
    vals
  ).catch((err: unknown) => dbError(err, "updateEmployee.update"));

  // Cambio de grupo de turno: cierra el actual y abre el nuevo
  if (data.grupoTurnoId !== undefined && data.grupoTurnoId !== null) {
    const today     = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().split("T")[0];

    await query(
      `UPDATE usuarios_grupos_turno SET fecha_fin = $1
       WHERE usuario_id = $2 AND empresa_id = $3 AND fecha_fin IS NULL`,
      [yesterday, id, empresaId]
    ).catch((err: unknown) => dbError(err, "updateEmployee.close_grupo"));

    await query(
      `INSERT INTO usuarios_grupos_turno (usuario_id, empresa_id, grupo_turno_id, fecha_inicio)
       VALUES ($1, $2, $3, $4)`,
      [id, empresaId, data.grupoTurnoId, today]
    ).catch((err: unknown) => dbError(err, "updateEmployee.new_grupo"));
  }

  return { id, updated: true };
}

export async function deleteEmployee(id: string, empresaId: string) {
  const found = await queryOne<{ id: string }>(
    `SELECT id FROM usuarios WHERE id = $1 AND empresa_id = $2`,
    [id, empresaId]
  ).catch((err: unknown) => dbError(err, "deleteEmployee.find"));

  if (!found) throw Errors.notFound("Empleado no encontrado");

  await query(
    `UPDATE usuarios SET activo = false, updated_at = now() WHERE id = $1 AND empresa_id = $2`,
    [id, empresaId]
  ).catch((err: unknown) => dbError(err, "deleteEmployee.update"));

  return { id, status: "inactivo" };
}
