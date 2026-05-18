import { FastifyInstance } from "fastify";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireAdminRole } from "../../middleware/role.middleware";
import * as devicesController from "./devices.controller";

export async function devicesRoutes(fastify: FastifyInstance) {
  const auth      = [authMiddleware];
  const adminOnly = [authMiddleware, requireAdminRole()];

  // Cualquier usuario autenticado puede solicitar registro de su dispositivo
  fastify.post("/devices/register-request", { preHandler: auth },      devicesController.registerHandler);
  // Solo RRHH / gerencia / platform_admin autorizan dispositivos
  fastify.post("/devices/authorize",        { preHandler: adminOnly }, devicesController.authorizeHandler);
  fastify.get("/devices",                   { preHandler: adminOnly }, devicesController.listHandler);
}
