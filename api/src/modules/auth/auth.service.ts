import bcrypt from "bcryptjs";
import { queryOne, dbError } from "../../config/db";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/jwt";
import { Errors } from "../../utils/errors";
import type { LoginRequest, AuthResponse, AuthUser, RefreshResponse } from "./auth.types";

interface DbPlatformAdmin {
  id: string;
  email: string;
  nombre: string;
  password_hash: string;
  activo: boolean;
}

interface DbUsuario {
  id: string;
  empresa_id: string;
  rut: string;
  nombre: string;
  email: string;
  password_hash: string;
  role: string;
  sitio_id: string | null;
  supervisor_id: string | null;
  passkey_registrado: boolean;
}

interface DbGrupoTurno {
  id: string;
  nombre: string;
  tipo: string;
}

async function getActiveGrupoTurno(userId: string, empresaId: string): Promise<DbGrupoTurno | null> {
  const today = new Date().toISOString().split("T")[0];

  const ugt = await queryOne<{ grupo_turno_id: string }>(
    `SELECT ugt.grupo_turno_id
     FROM usuarios_grupos_turno ugt
     JOIN grupos_turno gt ON gt.id = ugt.grupo_turno_id AND gt.empresa_id = $2
     WHERE ugt.usuario_id = $1
       AND (ugt.fecha_fin IS NULL OR ugt.fecha_fin >= $3)
     ORDER BY ugt.fecha_inicio DESC LIMIT 1`,
    [userId, empresaId, today]
  ).catch((err: unknown) => dbError(err, "getActiveGrupoTurno.ugt"));

  if (!ugt) return null;

  return queryOne<DbGrupoTurno>(
    `SELECT id, nombre, tipo FROM grupos_turno WHERE id = $1 AND empresa_id = $2`,
    [ugt.grupo_turno_id, empresaId]
  ).catch((err: unknown) => dbError(err, "getActiveGrupoTurno.grupo"));
}

function mapRole(dbRole: string): AuthUser["role"] {
  if (dbRole === "colaborador") return "employee";
  if (dbRole === "supervisor")  return "supervisor";
  return "admin"; // rrhh, gerencia
}

function buildAuthUser(usuario: DbUsuario, grupo: DbGrupoTurno | null): AuthUser {
  return {
    id:               usuario.id,
    email:            usuario.email,
    rut:              usuario.rut,
    name:             usuario.nombre,
    role:             mapRole(usuario.role),
    empresaId:        usuario.empresa_id,
    siteId:           usuario.sitio_id,
    supervisorId:     usuario.supervisor_id,
    grupoTurnoId:     grupo?.id     ?? null,
    grupoTurnoTipo:   grupo?.tipo   ?? null,
    grupoTurnoNombre: grupo?.nombre ?? null,
    passkey:          usuario.passkey_registrado,
  };
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const identifier = data.identifier.trim().toLowerCase();
  const isEmail    = identifier.includes("@");

  // 1. Buscar en platform_admins (solo por email)
  if (isEmail) {
    const admin = await queryOne<DbPlatformAdmin>(
      `SELECT id, email, nombre, password_hash, activo FROM platform_admins WHERE email = $1`,
      [identifier]
    ).catch((err: unknown) => dbError(err, "login.platform_admins"));

    if (admin) {
      if (!admin.activo) throw Errors.unauthorized("Cuenta inactiva");
      const valid = await bcrypt.compare(data.password, admin.password_hash);
      if (!valid) throw Errors.unauthorized("Credenciales incorrectas");

      const user: AuthUser = {
        id: admin.id, email: admin.email, name: admin.nombre,
        role: null, empresaId: null, isPlatformAdmin: true,
      };
      return {
        token:  signAccessToken({ sub: admin.id, email: admin.email, role: null, empresaId: null, isPlatformAdmin: true }),
        refreshToken: signRefreshToken(admin.id),
        expiresIn:    900,
        user,
      };
    }
  }

  // 2. Buscar en usuarios (por email o rut)
  const col    = isEmail ? "email" : "rut";
  const usuario = await queryOne<DbUsuario>(
    `SELECT id, empresa_id, rut, nombre, email, password_hash, role,
            sitio_id, supervisor_id, passkey_registrado
     FROM usuarios WHERE ${col} = $1 AND activo = true`,
    [identifier]
  ).catch((err: unknown) => dbError(err, "login.usuarios"));

  if (!usuario) throw Errors.unauthorized("Credenciales incorrectas");

  const valid = await bcrypt.compare(data.password, usuario.password_hash);
  if (!valid) throw Errors.unauthorized("Credenciales incorrectas");

  const grupo = await getActiveGrupoTurno(usuario.id, usuario.empresa_id);
  const user  = buildAuthUser(usuario, grupo);

  return {
    token:  signAccessToken({ sub: usuario.id, email: usuario.email, role: usuario.role as import("../../utils/jwt").UserRole, empresaId: usuario.empresa_id }),
    refreshToken: signRefreshToken(usuario.id),
    expiresIn:    900,
    user,
  };
}

export async function refresh(token: string): Promise<RefreshResponse> {
  let payload: { sub: string };
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw Errors.unauthorized("Refresh token inválido o expirado");
  }

  // Intentar platform_admin
  const admin = await queryOne<{ id: string; email: string; activo: boolean }>(
    `SELECT id, email, activo FROM platform_admins WHERE id = $1`,
    [payload.sub]
  ).catch((err: unknown) => dbError(err, "refresh.platform_admins"));

  if (admin) {
    if (!admin.activo) throw Errors.unauthorized("Cuenta inactiva");
    return {
      token: signAccessToken({ sub: admin.id, email: admin.email, role: null, empresaId: null, isPlatformAdmin: true }),
      expiresIn:   900,
    };
  }

  // Intentar usuario laboral
  const usuario = await queryOne<{ id: string; email: string; empresa_id: string; role: string; activo: boolean }>(
    `SELECT id, email, empresa_id, role, activo FROM usuarios WHERE id = $1`,
    [payload.sub]
  ).catch((err: unknown) => dbError(err, "refresh.usuarios"));

  if (!usuario) throw Errors.unauthorized("Usuario no encontrado o inactivo");
  if (!usuario.activo) throw Errors.unauthorized("Cuenta inactiva");

  return {
    token: signAccessToken({ sub: usuario.id, email: usuario.email, role: usuario.role as import("../../utils/jwt").UserRole, empresaId: usuario.empresa_id }),
    expiresIn:   900,
  };
}

export async function getMe(userId: string, isPlatformAdmin: boolean): Promise<AuthUser> {
  if (isPlatformAdmin) {
    const admin = await queryOne<DbPlatformAdmin>(
      `SELECT id, email, nombre, activo FROM platform_admins WHERE id = $1 AND activo = true`,
      [userId]
    ).catch((err: unknown) => dbError(err, "getMe.platform_admins"));

    if (!admin) throw Errors.notFound("Usuario no encontrado");
    return { id: admin.id, email: admin.email, name: admin.nombre, role: null, empresaId: null, isPlatformAdmin: true };
  }

  const usuario = await queryOne<DbUsuario>(
    `SELECT id, empresa_id, rut, nombre, email, role, sitio_id, supervisor_id, passkey_registrado
     FROM usuarios WHERE id = $1 AND activo = true`,
    [userId]
  ).catch((err: unknown) => dbError(err, "getMe.usuarios"));

  if (!usuario) throw Errors.notFound("Usuario no encontrado");

  const grupo = await getActiveGrupoTurno(usuario.id, usuario.empresa_id);
  return buildAuthUser(usuario, grupo);
}
