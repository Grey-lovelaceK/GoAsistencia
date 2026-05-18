import { FastifyRequest, FastifyReply } from "fastify";
import type { UserRole } from "../utils/jwt";

type RoleOrPlatform = UserRole | "platform_admin";

export function requireRole(...roles: RoleOrPlatform[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const payload = request.jwtPayload;
    if (!payload) {
      void reply.status(401).send({ error: "No autorizado", code: "UNAUTHORIZED" });
      return;
    }
    if (roles.includes("platform_admin") && payload.isPlatformAdmin) return;
    if (payload.role && roles.includes(payload.role as RoleOrPlatform)) return;
    void reply.status(403).send({ error: "Rol insuficiente para esta operación", code: "FORBIDDEN" });
  };
}

export function requireAdminRole() {
  return requireRole("rrhh", "gerencia", "platform_admin");
}

export function requireSupervisorOrAdmin() {
  return requireRole("supervisor", "rrhh", "gerencia", "platform_admin");
}
