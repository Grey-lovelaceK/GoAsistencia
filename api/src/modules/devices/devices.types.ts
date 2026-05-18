export type DispositivoTipo = "tablet" | "mobile";

export interface RegisterDeviceRequest {
  deviceId: string;
  tipo: DispositivoTipo;
  nombre?: string;
  sitioId?: string;
  usuarioId?: string;
}

export interface AuthorizeDeviceRequest {
  deviceId: string;
  tipo?: DispositivoTipo; // requerido si el dispositivo no tiene registro previo
  nombre?: string;
  empresaId?: string;     // requerido cuando lo invoca un platform_admin
}

export interface DbDevice {
  id: string;
  empresa_id: string;
  sitio_id: string | null;
  usuario_id: string | null;
  device_id: string;
  tipo: DispositivoTipo;
  nombre: string | null;
  activo: boolean;
  registrado_en: string;
  ultimo_uso_en: string | null;
}

export interface DeviceResponse {
  id: string;
  empresaId: string;
  sitioId: string | null;
  usuarioId: string | null;
  deviceId: string;
  tipo: DispositivoTipo;
  nombre: string | null;
  activo: boolean;
  registradoEn: string;
  ultimoUsoEn: string | null;
}
