import jwt from "jsonwebtoken";
import { env } from "../config/env";

export type UserRole = "colaborador" | "supervisor" | "rrhh" | "gerencia";

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole | null;
  empresaId: string | null;
  isPlatformAdmin?: boolean;
  iat?: number;
  exp?: number;
}

type RefreshPayload = { sub: string; iat?: number; exp?: number };

export function signAccessToken(payload: Omit<JwtPayload, "iat" | "exp">): string {
  return jwt.sign(payload as object, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function signRefreshToken(sub: string): string {
  return jwt.sign({ sub }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): RefreshPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshPayload;
}
