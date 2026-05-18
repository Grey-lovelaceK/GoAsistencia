import { query, queryOne, dbError } from "../../config/db";
import type { DbDevice, DeviceResponse, RegisterDeviceRequest, AuthorizeDeviceRequest } from "./devices.types";

function mapDevice(row: DbDevice): DeviceResponse {
  return {
    id:           row.id,
    empresaId:    row.empresa_id,
    sitioId:      row.sitio_id,
    usuarioId:    row.usuario_id,
    deviceId:     row.device_id,
    tipo:         row.tipo,
    nombre:       row.nombre,
    activo:       row.activo,
    registradoEn: row.registrado_en,
    ultimoUsoEn:  row.ultimo_uso_en,
  };
}

export async function registerDeviceRequest(
  data: RegisterDeviceRequest,
  empresaId: string
): Promise<{ deviceId: string; status: string; message: string }> {
  const existing = await queryOne<{ id: string; activo: boolean }>(
    `SELECT id, activo FROM dispositivos_autorizados
     WHERE device_id = $1 AND empresa_id = $2`,
    [data.deviceId, empresaId]
  ).catch((err: unknown) => dbError(err, "registerDeviceRequest.find"));

  if (existing) {
    return {
      deviceId: data.deviceId,
      status:   existing.activo ? "activo" : "pendiente",
      message:  existing.activo
        ? "El dispositivo ya está autorizado"
        : "Solicitud pendiente de autorización. Contacta a RRHH.",
    };
  }

  await query(
    `INSERT INTO dispositivos_autorizados
       (empresa_id, device_id, tipo, nombre, sitio_id, usuario_id, activo)
     VALUES ($1, $2, $3, $4, $5, $6, false)`,
    [empresaId, data.deviceId, data.tipo, data.nombre ?? null, data.sitioId ?? null, data.usuarioId ?? null]
  ).catch((err: unknown) => dbError(err, "registerDeviceRequest.insert"));

  return {
    deviceId: data.deviceId,
    status:   "pendiente",
    message:  "Solicitud de registro creada. Pendiente de autorización por RRHH.",
  };
}

export async function authorizeDevice(
  data: AuthorizeDeviceRequest,
  empresaId: string
): Promise<{ deviceId: string; status: string; message: string }> {
  const existing = await queryOne<{ id: string; tipo: string }>(
    `SELECT id, tipo FROM dispositivos_autorizados
     WHERE device_id = $1 AND empresa_id = $2`,
    [data.deviceId, empresaId]
  ).catch((err: unknown) => dbError(err, "authorizeDevice.find"));

  if (existing) {
    const sets = ["activo = true"];
    const vals: unknown[] = [existing.id];
    if (data.nombre) {
      vals.push(data.nombre);
      sets.push(`nombre = $${vals.length}`);
    }
    await query(
      `UPDATE dispositivos_autorizados SET ${sets.join(", ")} WHERE id = $1`,
      vals
    ).catch((err: unknown) => dbError(err, "authorizeDevice.update"));
  } else {
    const tipo = data.tipo ?? "mobile";
    if (!data.tipo) {
      console.warn("[Devices] authorizeDevice sin tipo especificado. Usando 'mobile'.");
    }
    await query(
      `INSERT INTO dispositivos_autorizados (empresa_id, device_id, tipo, nombre, activo)
       VALUES ($1, $2, $3, $4, true)`,
      [empresaId, data.deviceId, tipo, data.nombre ?? null]
    ).catch((err: unknown) => dbError(err, "authorizeDevice.insert"));
  }

  return {
    deviceId: data.deviceId,
    status:   "autorizado",
    message:  "Dispositivo autorizado correctamente.",
  };
}

export async function getDevices(empresaId: string): Promise<{ dispositivos: DeviceResponse[] }> {
  const rows = await query<DbDevice>(
    `SELECT id, empresa_id, sitio_id, usuario_id, device_id, tipo, nombre,
            activo, registrado_en, ultimo_uso_en
     FROM dispositivos_autorizados
     WHERE empresa_id = $1 ORDER BY registrado_en DESC`,
    [empresaId]
  ).catch((err: unknown) => dbError(err, "getDevices"));

  return { dispositivos: rows.map(mapDevice) };
}
