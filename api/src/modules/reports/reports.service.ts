import { query, dbError } from "../../config/db";
import type { ReportRecord, ReportSummary, ReportFilters } from "./reports.types";

interface DbReporte {
  id: string;
  usuario_id: string;
  empresa_id: string;
  sitio_id: string | null;
  grupo_turno_id: string | null;
  fecha: string;
  horas_trabajadas: unknown; // pg devuelve INTERVAL como objeto { hours, minutes, ... }
  minutos_atraso: number | null;
  horas_extra: number | null;
  nro_reposiciones: number | null;
  status: string;
}

type PgInterval = { years?: number; months?: number; days?: number; hours?: number; minutes?: number; seconds?: number };

function formatWorkedHours(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") {
    const parts = value.split(":");
    if (parts.length >= 2) return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
    return value;
  }
  if (typeof value === "object") {
    const iv = value as PgInterval;
    const h = (iv.hours ?? 0) + (iv.days ?? 0) * 24;
    const m = iv.minutes ?? 0;
    return `${String(h).padStart(2, "0")}:${String(Math.round(m)).padStart(2, "0")}`;
  }
  return String(value);
}

function buildSummary(records: ReportRecord[]): ReportSummary {
  return {
    total:    records.length,
    present:  records.filter((r) => r.status !== "absent").length,
    absent:   records.filter((r) => r.status === "absent").length,
    late:     records.filter((r) => r.status === "late").length,
    overtime: records.filter((r) => r.status === "overtime").length,
  };
}

async function enrichReports(reportes: DbReporte[], empresaId: string): Promise<ReportRecord[]> {
  if (reportes.length === 0) return [];

  const userIds  = [...new Set(reportes.map((r) => r.usuario_id))];
  const siteIds  = [...new Set(reportes.filter((r) => r.sitio_id).map((r) => r.sitio_id as string))];
  const grupoIds = [...new Set(reportes.filter((r) => r.grupo_turno_id).map((r) => r.grupo_turno_id as string))];
  const fechas   = [...new Set(reportes.map((r) => r.fecha))];

  // ── Batch: usuarios ──────────────────────────────────────────────────────────
  const usuarios = await query<{ id: string; nombre: string; rut: string }>(
    `SELECT id, nombre, rut FROM usuarios WHERE id = ANY($1)`,
    [userIds]
  ).catch((err: unknown) => dbError(err, "enrichReports.usuarios"));
  const usuarioMap = new Map(usuarios.map((u) => [u.id, u]));

  // ── Batch: sitios ────────────────────────────────────────────────────────────
  const siteNameMap = new Map<string, string>();
  if (siteIds.length > 0) {
    const sitios = await query<{ id: string; nombre: string }>(
      `SELECT id, nombre FROM sitios WHERE id = ANY($1) AND empresa_id = $2`,
      [siteIds, empresaId]
    ).catch((err: unknown) => dbError(err, "enrichReports.sitios"));
    for (const s of sitios) siteNameMap.set(s.id, s.nombre);
  }

  // ── Batch: grupos de turno y sus turnos ──────────────────────────────────────
  const grupoMap = new Map<string, { nombre: string; tipo: string; turno_id: string | null }>();
  const turnoMap = new Map<string, { hora_inicio: string; hora_fin: string; minutos_colacion: number }>();

  if (grupoIds.length > 0) {
    const grupos = await query<{ id: string; nombre: string; tipo: string; turno_id: string | null }>(
      `SELECT id, nombre, tipo, turno_id FROM grupos_turno WHERE id = ANY($1) AND empresa_id = $2`,
      [grupoIds, empresaId]
    ).catch((err: unknown) => dbError(err, "enrichReports.grupos"));

    for (const g of grupos) grupoMap.set(g.id, g);

    const turnoIds = [...new Set(grupos.filter((g) => g.turno_id).map((g) => g.turno_id as string))];
    if (turnoIds.length > 0) {
      const turnos = await query<{ id: string; hora_inicio: string; hora_fin: string; minutos_colacion: number }>(
        `SELECT id, hora_inicio, hora_fin, minutos_colacion FROM turnos WHERE id = ANY($1) AND empresa_id = $2`,
        [turnoIds, empresaId]
      ).catch((err: unknown) => dbError(err, "enrichReports.turnos"));
      for (const t of turnos) turnoMap.set(t.id, t);
    }
  }

  // ── Batch: marcaciones del día ───────────────────────────────────────────────
  const marcaciones = await query<{ usuario_id: string; tipo: string; fecha_operativa: string; registrada_en: string }>(
    `SELECT usuario_id, tipo, fecha_operativa, registrada_en
     FROM marcaciones
     WHERE usuario_id = ANY($1) AND fecha_operativa = ANY($2) AND empresa_id = $3 AND estado = 'valida'`,
    [userIds, fechas, empresaId]
  ).catch((err: unknown) => dbError(err, "enrichReports.marcaciones"));

  type PunchTimes = { entrada?: string; salidaColacion?: string; entradaColacion?: string; salida?: string };
  const punchMap = new Map<string, PunchTimes>();
  for (const m of marcaciones) {
    const key  = `${m.usuario_id}-${m.fecha_operativa}`;
    if (!punchMap.has(key)) punchMap.set(key, {});
    const time = m.registrada_en.length >= 16 ? m.registrada_en.slice(11, 16) : m.registrada_en;
    const pt   = punchMap.get(key)!;
    if      (m.tipo === "entrada")          pt.entrada          = time;
    else if (m.tipo === "salida_colacion")  pt.salidaColacion   = time;
    else if (m.tipo === "entrada_colacion") pt.entradaColacion  = time;
    else if (m.tipo === "salida")           pt.salida           = time;
  }

  // ── Mapear ───────────────────────────────────────────────────────────────────
  return reportes.map((r) => {
    const usuario = usuarioMap.get(r.usuario_id);
    const grupo   = r.grupo_turno_id ? grupoMap.get(r.grupo_turno_id) : null;
    const turno   = grupo?.turno_id  ? turnoMap.get(grupo.turno_id)  : null;

    return {
      userId:           r.usuario_id,
      name:             usuario?.nombre ?? "—",
      rut:              usuario?.rut    ?? "—",
      siteId:           r.sitio_id      ?? "",
      siteName:         r.sitio_id      ? (siteNameMap.get(r.sitio_id) ?? "—") : "—",
      date:             r.fecha,
      grupoTurnoTipo:   grupo?.tipo    as ReportRecord["grupoTurnoTipo"],
      grupoTurnoNombre: grupo?.nombre,
      shift:            turno
        ? { start: turno.hora_inicio, end: turno.hora_fin, breakMinutes: turno.minutos_colacion }
        : { start: "—", end: "—", breakMinutes: 0 },
      punches:          punchMap.get(`${r.usuario_id}-${r.fecha}`) ?? {},
      horasTrabajadas:  formatWorkedHours(r.horas_trabajadas),
      minutosAtraso:    r.minutos_atraso   ?? 0,
      horasExtra:       r.horas_extra      ?? 0,
      nroReposiciones:  r.nro_reposiciones ?? 0,
      status:           r.status           as ReportRecord["status"],
    };
  });
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export async function getDailyReports(params: {
  empresaId: string;
  role: string | null;
  userId: string;
  isPlatformAdmin: boolean;
  filters: ReportFilters;
}): Promise<{ records: ReportRecord[]; summary: ReportSummary; nextCursor: null }> {
  const empty = {
    records:    [] as ReportRecord[],
    summary:    { total: 0, present: 0, absent: 0, late: 0, overtime: 0 } as ReportSummary,
    nextCursor: null as null,
  };

  const conditions: string[] = [];
  const vals: unknown[] = [];

  conditions.push(`empresa_id = $${vals.push(params.empresaId)}`);
  if (params.filters.from)       conditions.push(`fecha >= $${vals.push(params.filters.from)}`);
  if (params.filters.to)         conditions.push(`fecha <= $${vals.push(params.filters.to)}`);
  if (params.filters.siteId)     conditions.push(`sitio_id = $${vals.push(params.filters.siteId)}`);
  if (params.filters.employeeId) conditions.push(`usuario_id = $${vals.push(params.filters.employeeId)}`);
  if (params.filters.status)     conditions.push(`status = $${vals.push(params.filters.status)}`);

  // Supervisor: solo ve sus supervisados
  if (params.role === "supervisor") {
    const subordinados = await query<{ id: string }>(
      `SELECT id FROM usuarios WHERE supervisor_id = $1 AND empresa_id = $2 AND activo = true`,
      [params.userId, params.empresaId]
    ).catch((err: unknown) => dbError(err, "getDailyReports.supervisor"));

    if (subordinados.length === 0) return empty;
    conditions.push(`usuario_id = ANY($${vals.push(subordinados.map((u) => u.id))})`);
  } else if (params.filters.supervisorId) {
    const subordinados = await query<{ id: string }>(
      `SELECT id FROM usuarios WHERE supervisor_id = $1 AND empresa_id = $2`,
      [params.filters.supervisorId, params.empresaId]
    ).catch((err: unknown) => dbError(err, "getDailyReports.supervisorFilter"));

    if (subordinados.length === 0) return empty;
    conditions.push(`usuario_id = ANY($${vals.push(subordinados.map((u) => u.id))})`);
  }

  const reportes = await query<DbReporte>(
    `SELECT id, usuario_id, empresa_id, sitio_id, grupo_turno_id, fecha,
            horas_trabajadas, minutos_atraso, horas_extra, nro_reposiciones, status
     FROM reportes_diarios
     WHERE ${conditions.join(" AND ")}
     ORDER BY fecha DESC`,
    vals
  ).catch((err: unknown) => dbError(err, "getDailyReports.query"));

  const records = await enrichReports(reportes, params.empresaId);
  return { records, summary: buildSummary(records), nextCursor: null };
}

export function exportReports(_filters: ReportFilters): {
  url: string;
  expiresAt: string;
  filename: string;
} {
  // TODO Fase 4: generar Excel/CSV real y retornar URL pre-firmada.
  return {
    url:       "mock://export-disabled-in-phase-3",
    expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    filename:  `reporte_${new Date().toISOString().split("T")[0]}.xlsx`,
  };
}
