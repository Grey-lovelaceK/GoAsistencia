export type PunchTipo    = "entrada" | "salida_colacion" | "entrada_colacion" | "salida";
export type PunchEstado  = "valida"  | "anulada"        | "corregida";

export interface CreatePunchRequest {
  siteId:           string;
  type:             PunchTipo;
  timestamp:        string;   // ISO 8601
  deviceId:         string;
  photoKey?:        string;
  webAuthnToken?:   string;
  latitude?:        number;
  longitude?:       number;
  distanceMeters?:  number;
  isWithinGeofence?: boolean;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  photoKey:  string;
  expiresIn: number;
}

export interface PunchResponse {
  id:               string;
  userId:           string;
  siteId:           string;
  type:             PunchTipo;
  estado:           PunchEstado;
  fechaOperativa:   string;
  recordedAt:       string;
  distanceMeters:   number | null;
  isWithinGeofence: boolean | null;
  dispositivoId:    string | null;
  photoUrl:         string | null;
}

export interface PunchListResponse {
  punches:    PunchResponse[];
  nextCursor: string | null;
  total:      number;
}
