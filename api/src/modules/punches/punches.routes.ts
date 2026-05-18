import { FastifyInstance } from "fastify";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import * as punchesController from "./punches.controller";

export async function punchesRoutes(fastify: FastifyInstance) {
  // Roles que pueden marcar: todos los usuarios laborales (no platform_admin puro)
  const canPunch = [authMiddleware, requireRole("colaborador", "supervisor", "rrhh", "gerencia")];
  const auth     = [authMiddleware];

  fastify.post("/punches/presigned-url", { preHandler: canPunch }, punchesController.uploadUrlHandler);
  fastify.post("/punches",            { preHandler: canPunch }, punchesController.createHandler);
  fastify.get("/punches",             { preHandler: auth     }, punchesController.listHandler);
}
