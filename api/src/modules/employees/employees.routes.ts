import { FastifyInstance } from "fastify";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireAdminRole, requireSupervisorOrAdmin } from "../../middleware/role.middleware";
import * as employeesController from "./employees.controller";

export async function employeesRoutes(fastify: FastifyInstance) {
  const adminOnly      = [authMiddleware, requireAdminRole()];
  const supervisorPlus = [authMiddleware, requireSupervisorOrAdmin()];

  fastify.get("/employees",      { preHandler: supervisorPlus }, employeesController.listHandler);
  fastify.post("/employees",     { preHandler: adminOnly },      employeesController.createHandler);
  fastify.put("/employees/:id",  { preHandler: adminOnly },      employeesController.updateHandler);
  fastify.delete("/employees/:id", { preHandler: adminOnly },    employeesController.deleteHandler);
}
