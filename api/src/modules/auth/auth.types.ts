export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  rut?: string;
  name: string;
  role: "employee" | "supervisor" | "admin" | null;
  empresaId: string | null;
  siteId?: string | null;
  supervisorId?: string | null;
  grupoTurnoId?: string | null;
  grupoTurnoTipo?: string | null;
  grupoTurnoNombre?: string | null;
  passkey?: boolean;
  isPlatformAdmin?: boolean;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface RefreshResponse {
  token: string;
  expiresIn: number;
}
