import { FastifyInstance } from "fastify";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import * as sitesController from "./sites.controller";

export async function sitesRoutes(fastify: FastifyInstance) {
  const auth      = [authMiddleware];
  const adminAuth = [authMiddleware, requireRole("gerencia", "rrhh", "platform_admin")];

  fastify.get("/sites",                        { preHandler: auth },      sitesController.listHandler);
  fastify.get("/sites/:id",                    { preHandler: auth },      sitesController.getOneHandler);
  fastify.post("/sites",                       { preHandler: adminAuth }, sitesController.createHandler);
  fastify.put("/sites/:id",                    { preHandler: adminAuth }, sitesController.updateHandler);
  fastify.post("/sites/:id/shifts",            { preHandler: adminAuth }, sitesController.createShiftHandler);
  fastify.put("/sites/:id/shifts/:shiftId",    { preHandler: adminAuth }, sitesController.updateShiftHandler);
  fastify.delete("/sites/:id/shifts/:shiftId", { preHandler: adminAuth }, sitesController.deleteShiftHandler);
}
