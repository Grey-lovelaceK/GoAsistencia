import { FastifyInstance } from "fastify";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireSupervisorOrAdmin } from "../../middleware/role.middleware";
import * as exceptionsController from "./exceptions.controller";

export async function exceptionsRoutes(fastify: FastifyInstance) {
  const supervisorPlus = [authMiddleware, requireSupervisorOrAdmin()];

  fastify.get("/exceptions",        { preHandler: supervisorPlus }, exceptionsController.listHandler);
  fastify.post("/exceptions",       { preHandler: supervisorPlus }, exceptionsController.createHandler);
  fastify.put("/exceptions/:id",    { preHandler: supervisorPlus }, exceptionsController.updateHandler);
  fastify.delete("/exceptions/:id", { preHandler: supervisorPlus }, exceptionsController.deleteHandler);
}
