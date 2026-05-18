export type PunchType = "entrada" | "salida" | "salida_colacion" | "entrada_colacion";

export interface PresignedUrlRequest {
  contentType: string;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  photoKey: string;
  expiresIn: number;
}

export interface PunchRequest {
  siteId: string;
  type: PunchType;
  lat: number;
  lng: number;
  accuracy: number;
  deviceId: string;
  timestamp: string;
  photoKey: string;
  webAuthnToken: string;
}

export interface PunchResponse {
  id: string;
  userId: string;
  siteId: string;
  type: PunchType;
  recordedAt: string;
  distanceMeters: number;
  isWithinGeofence: boolean;
  shiftId: string;
  photoUrl: string;
}

export interface Punch {
  id: string;
  type: PunchType;
  recordedAt: string;
  distanceMeters: number;
  isWithinGeofence: boolean;
  shift?: {
    name: string;
    start: string;
    end: string;
  };
}

export interface PunchListResponse {
  punches: Punch[];
  nextCursor: string | null;
  total: number;
}
