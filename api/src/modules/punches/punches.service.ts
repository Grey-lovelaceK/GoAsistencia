import { query, queryOne, dbError } from "../../config/db";
import { Errors } from "../../utils/errors";
import type { CreatePunchRequest, PunchResponse, PunchListResponse } from "./punches.types";

// ─── Helpers internos ────────────────────────────────────────────────────────

interface DbPolitica {
  canal_permitido:      string;
  requiere_geofence:    boolean;
  requiere_biometria:   boolean;
  requiere_foto:        boolean;
  tolerancia_atraso_min: number;
}

async function resolvePunchPolicy(
  empresaId: string,
  siteId: string,
  role: string
): Promise<DbPolitica> {
  const SELECT = `
    SELECT canal_permitido, requiere_geofence, requiere_biometria, requiere_foto, tolerancia_atraso_min
    FROM politicas_marcacion
  `;

  // 1. Política específica del sitio + role
  const sitePolicy = await queryOne<DbPolitica>(
    `${SELECT} WHERE empresa_id = $1 AND sitio_id = $2 AND role = $3 LIMIT 1`,
    [empresaId, siteId, role]
  ).catch((err: unknown) => dbError(err, "resolvePunchPolicy.site"));

  if (sitePolicy) return sitePolicy;

  // 2. Política global (sin sitio) + role
  const globalPolicy = await queryOne<DbPolitica>(
    `${SELECT} WHERE empresa_id = $1 AND sitio_id IS NULL AND role = $2 LIMIT 1`,
    [empresaId, role]
  ).catch((err: unknown) => dbError(err, "resolvePunchPolicy.global"));

  if (globalPolicy) return globalPolicy;

  // 3. Sin política → defaults permisivos
  console.warn(`[Punch] Sin política para role='${role}' sitio='${siteId}'. Usando defaults permisivos.`);
  return {
    canal_permitido:      "both",
    requiere_geofence:    false,
    requiere_biometria:   false,
    requiere_foto:        false,
    tolerancia_atraso_min: 0,
  };
}

function calcularFechaOperativa(
  grupoTipo: string,
  turno: { hora_inicio: string; hora_fin: string } | null,
  timestamp: string
): string {
  const now   = new Date(timestamp);
  const today = now.toISOString().split("T")[0];

  if (grupoTipo === "libre" || !turno) return today;

  const [finH, finM] = turno.hora_fin.split(":").map(Number);
  const [iniH, iniM] = turno.hora_inicio.split(":").map(Number);
  const finMin = finH * 60 + finM;
  const iniMin = iniH * 60 + iniM;

  if (finMin < iniMin) {
    const nowMin = now.getUTCHours() * 60 + now.getUTCMinutes();
    if (nowMin < finMin) {
      const yesterday = new Date(now);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      return yesterday.toISOString().split("T")[0];
    }
  }
  return today;
}

async function updateDailyReport(
  userId: string,
  empresaId: string,
  siteId: string,
  fechaOperativa: string
): Promise<void> {
  // TODO Fase 4: calcular horas_trabajadas, minutos_atraso y horas_extra reales.
  await query(
    `INSERT INTO reportes_diarios
       (usuario_id, empresa_id, sitio_id, fecha, status, horas_trabajadas, minutos_atraso, horas_extra, nro_reposiciones)
     VALUES ($1, $2, $3, $4, 'on_time', '00:00', 0, 0, 0)
     ON CONFLICT (usuario_id, empresa_id, fecha) DO NOTHING`,
    [userId, empresaId, siteId, fechaOperativa]
  ).catch((err: unknown) => {
    console.warn("[Reporte Diario] UPSERT no fatal — error:", (err as Error).message);
  });
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export function getUploadUrl(): { uploadUrl: string; photoKey: string; expiresIn: number } {
  // TODO Fase 4: integrar con S3/Storage para URLs pre-firmadas reales.
  return {
    uploadUrl: "mock://upload-disabled-in-phase-3",
    photoKey:  `photos/mock/${Date.now()}.jpg`,
    expiresIn: 120,
  };
}

export async function createPunch(
  data: CreatePunchRequest,
  userId: string,
  empresaId: string,
  userRole: string
): Promise<PunchResponse> {
  // 1. Resolver política de marcación
  const policy = await resolvePunchPolicy(empresaId, data.siteId, userRole);

  // 2. Validar foto
  if (policy.requiere_foto && !data.photoKey) {
    throw Errors.badRequest("Esta política requiere foto de evidencia (photoKey requerido)");
  }

  // 3. Validar biometría
  if (policy.requiere_biometria && !data.webAuthnToken) {
    throw Errors.badRequest("Esta política requiere verificación biométrica (webAuthnToken requerido)");
  }
  // TODO Fase 4: verificar firma webAuthnToken contra passkey registrado del usuario

  // 4. Validar geofence
  // El backend NO confía ciegamente en isWithinGeofence del cliente.
  // TODO Fase 4: calcular distancia real en backend con Haversine.
  if (policy.requiere_geofence) {
    if (data.distanceMeters === undefined || data.distanceMeters === null) {
      throw Errors.badRequest("Esta política requiere geolocalización (distanceMeters requerido)");
    }
    if (data.isWithinGeofence !== true) {
      throw Errors.badRequest("No estás dentro del área geográfica permitida para marcar asistencia");
    }
  }

  // 5. Validar dispositivo autorizado (TODO Fase 4: hacer obligatorio en producción)
  const device = await queryOne<{ id: string; tipo: string }>(
    `SELECT id, tipo FROM dispositivos_autorizados
     WHERE device_id = $1 AND empresa_id = $2 AND activo = true`,
    [data.deviceId, empresaId]
  ).catch((err: unknown) => dbError(err, "createPunch.device"));

  if (!device) {
    console.warn(`[Punch] Device '${data.deviceId}' no registrado — permitiendo sin validación de dispositivo`);
  }

  // 6. Validar canal permitido (solo si hay política estricta y dispositivo conocido)
  if (device && policy.canal_permitido !== "both" && policy.canal_permitido !== device.tipo) {
    throw Errors.forbidden(
      `Canal '${device.tipo}' no permitido. La política requiere: '${policy.canal_permitido}'`
    );
  }

  // 7. Resolver grupo de turno activo
  const today = new Date().toISOString().split("T")[0];
  const ugt = await queryOne<{ grupo_turno_id: string }>(
    `SELECT ugt.grupo_turno_id
     FROM usuarios_grupos_turno ugt
     JOIN grupos_turno gt ON gt.id = ugt.grupo_turno_id AND gt.empresa_id = $2
     WHERE ugt.usuario_id = $1
       AND (ugt.fecha_fin IS NULL OR ugt.fecha_fin >= $3)
     ORDER BY ugt.fecha_inicio DESC LIMIT 1`,
    [userId, empresaId, today]
  ).catch((err: unknown) => dbError(err, "createPunch.ugt"));

  let grupoTipo = "fijo";
  let turno: { hora_inicio: string; hora_fin: string } | null = null;

  if (ugt) {
    const gt = await queryOne<{ tipo: string; turno_id: string | null }>(
      `SELECT tipo, turno_id FROM grupos_turno WHERE id = $1 AND empresa_id = $2`,
      [ugt.grupo_turno_id, empresaId]
    ).catch((err: unknown) => dbError(err, "createPunch.grupo"));

    if (gt) {
      grupoTipo = gt.tipo;
      if (gt.turno_id) {
        turno = await queryOne<{ hora_inicio: string; hora_fin: string }>(
          `SELECT hora_inicio, hora_fin FROM turnos WHERE id = $1 AND empresa_id = $2`,
          [gt.turno_id, empresaId]
        ).catch((err: unknown) => dbError(err, "createPunch.turno"));
      }
    }
  }

  // 8. Calcular fecha_operativa
  const fechaOperativa = calcularFechaOperativa(grupoTipo, turno, data.timestamp);

  // 9. Verificar marcación duplicada
  const dup = await queryOne<{ id: string }>(
    `SELECT id FROM marcaciones
     WHERE usuario_id = $1 AND empresa_id = $2 AND tipo = $3
       AND fecha_operativa = $4 AND estado = 'valida'
     LIMIT 1`,
    [userId, empresaId, data.type, fechaOperativa]
  ).catch((err: unknown) => dbError(err, "createPunch.dup"));

  if (dup) {
    throw Errors.conflict(
      `Ya existe una marcación '${data.type}' válida para la fecha operativa ${fechaOperativa}`
    );
  }

  // 10. Insertar marcación
  const rows = await query<{
    id: string; usuario_id: string; sitio_id: string | null; tipo: string;
    estado: string; fecha_operativa: string; registrada_en: string;
    distance_meters: number | null; is_within_geofence: boolean | null;
    dispositivo_id: string | null; photo_key: string | null;
  }>(
    `INSERT INTO marcaciones
       (usuario_id, empresa_id, sitio_id, dispositivo_id, tipo, estado,
        fecha_operativa, registrada_en, distance_meters, is_within_geofence, photo_key)
     VALUES ($1, $2, $3, $4, $5, 'valida', $6, $7, $8, $9, $10)
     RETURNING id, usuario_id, sitio_id, tipo, estado, fecha_operativa, registrada_en,
               distance_meters, is_within_geofence, dispositivo_id, photo_key`,
    [
      userId, empresaId, data.siteId, device?.id ?? null, data.type,
      fechaOperativa, data.timestamp,
      data.distanceMeters   ?? null,
      data.isWithinGeofence ?? null,
      data.photoKey         ?? null,
    ]
  ).catch((err: unknown) => dbError(err, "createPunch.insert"));

  const m = rows[0];

  // 11. Actualizar reporte diario (non-fatal)
  void updateDailyReport(userId, empresaId, data.siteId, fechaOperativa);

  return {
    id:               m.id,
    userId:           m.usuario_id,
    siteId:           m.sitio_id ?? data.siteId,
    type:             m.tipo as CreatePunchRequest["type"],
    estado:           m.estado as "valida",
    fechaOperativa:   m.fecha_operativa,
    recordedAt:       m.registrada_en,
    distanceMeters:   m.distance_meters,
    isWithinGeofence: m.is_within_geofence,
    dispositivoId:    m.dispositivo_id,
    photoUrl:         m.photo_key ? `mock://photo/${m.photo_key}` : null,
  };
}

export async function getPunches(
  userId: string,
  empresaId: string,
  limit = 20
): Promise<PunchListResponse> {
  const rows = await query<{
    id: string; usuario_id: string; sitio_id: string | null; tipo: string;
    estado: string; fecha_operativa: string; registrada_en: string;
    distance_meters: number | null; is_within_geofence: boolean | null;
    dispositivo_id: string | null; photo_key: string | null;
  }>(
    `SELECT id, usuario_id, sitio_id, tipo, estado, fecha_operativa, registrada_en,
            distance_meters, is_within_geofence, dispositivo_id, photo_key
     FROM marcaciones
     WHERE usuario_id = $1 AND empresa_id = $2
     ORDER BY registrada_en DESC LIMIT $3`,
    [userId, empresaId, limit]
  ).catch((err: unknown) => dbError(err, "getPunches"));

  const punches = rows.map((m) => ({
    id:               m.id,
    userId:           m.usuario_id,
    siteId:           m.sitio_id ?? "",
    type:             m.tipo as PunchResponse["type"],
    estado:           m.estado as PunchResponse["estado"],
    fechaOperativa:   m.fecha_operativa,
    recordedAt:       m.registrada_en,
    distanceMeters:   m.distance_meters,
    isWithinGeofence: m.is_within_geofence,
    dispositivoId:    m.dispositivo_id,
    photoUrl:         m.photo_key ? `mock://photo/${m.photo_key}` : null,
  }));

  return { punches, nextCursor: null, total: punches.length };
}
