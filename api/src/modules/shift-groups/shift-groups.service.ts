import { query, queryOne, dbError } from "../../config/db";
import { Errors } from "../../utils/errors";

interface DbGrupo {
  id: string;
  empresa_id: string;
  nombre: string;
  tipo: string;
  turno_id: string | null;
}

interface DbTurno {
  id: string;
  nombre: string;
  hora_inicio: string;
  hora_fin: string;
  minutos_colacion: number;
  sitio_id: string | null;
}

function mapGrupo(g: DbGrupo, turno: DbTurno | null) {
  return {
    id: g.id,
    empresaId: g.empresa_id,
    nombre: g.nombre,
    tipo: g.tipo,
    turnoId: g.turno_id,
    turno: turno
      ? {
          id: turno.id,
          nombre: turno.nombre,
          horaInicio: turno.hora_inicio,
          horaFin: turno.hora_fin,
          minutosColacion: turno.minutos_colacion,
          sitioId: turno.sitio_id,
        }
      : null,
  };
}

async function getTurnos(turnoIds: string[], empresaId: string): Promise<Map<string, DbTurno>> {
  const map = new Map<string, DbTurno>();
  if (turnoIds.length === 0) return map;

  const rows = await query<DbTurno>(
    `SELECT id, nombre, hora_inicio, hora_fin, minutos_colacion, sitio_id
     FROM turnos WHERE id = ANY($1) AND empresa_id = $2`,
    [turnoIds, empresaId]
  ).catch((err: unknown) => dbError(err, "getTurnos"));

  for (const t of rows) map.set(t.id, t);
  return map;
}

export async function getShiftGroups(empresaId: string) {
  const grupos = await query<DbGrupo>(
    `SELECT id, empresa_id, nombre, tipo, turno_id
     FROM grupos_turno WHERE empresa_id = $1 ORDER BY nombre`,
    [empresaId]
  ).catch((err: unknown) => dbError(err, "getShiftGroups"));

  const turnoIds = [...new Set(grupos.filter((g) => g.turno_id).map((g) => g.turno_id as string))];
  const turnoMap = await getTurnos(turnoIds, empresaId);

  return {
    grupos: grupos.map((g) => mapGrupo(g, g.turno_id ? (turnoMap.get(g.turno_id) ?? null) : null)),
  };
}

export async function getMyShiftGroup(userId: string, empresaId: string) {
  const today = new Date().toISOString().split("T")[0];

  const ugt = await queryOne<{ grupo_turno_id: string }>(
    `SELECT ugt.grupo_turno_id
     FROM usuarios_grupos_turno ugt
     JOIN grupos_turno gt ON gt.id = ugt.grupo_turno_id AND gt.empresa_id = $2
     WHERE ugt.usuario_id = $1
       AND (ugt.fecha_fin IS NULL OR ugt.fecha_fin >= $3)
     ORDER BY ugt.fecha_inicio DESC LIMIT 1`,
    [userId, empresaId, today]
  ).catch((err: unknown) => dbError(err, "getMyShiftGroup.ugt"));

  if (!ugt) throw Errors.notFound("No tienes grupo de turno asignado");

  const grupo = await queryOne<DbGrupo>(
    `SELECT id, empresa_id, nombre, tipo, turno_id
     FROM grupos_turno WHERE id = $1 AND empresa_id = $2`,
    [ugt.grupo_turno_id, empresaId]
  ).catch((err: unknown) => dbError(err, "getMyShiftGroup.grupo"));

  if (!grupo) throw Errors.notFound("Grupo de turno no encontrado");

  let turno: DbTurno | null = null;
  if (grupo.turno_id) {
    turno = await queryOne<DbTurno>(
      `SELECT id, nombre, hora_inicio, hora_fin, minutos_colacion, sitio_id
       FROM turnos WHERE id = $1 AND empresa_id = $2`,
      [grupo.turno_id, empresaId]
    ).catch((err: unknown) => dbError(err, "getMyShiftGroup.turno"));
  }

  return mapGrupo(grupo, turno);
}
