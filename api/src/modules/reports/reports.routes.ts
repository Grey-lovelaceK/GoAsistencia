import { FastifyInstance } from "fastify";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireSupervisorOrAdmin } from "../../middleware/role.middleware";
import * as reportsController from "./reports.controller";

export async function reportsRoutes(fastify: FastifyInstance) {
  const auth = [authMiddleware, requireSupervisorOrAdmin()];

  fastify.get("/reports/daily",    { preHandler: auth }, reportsController.dailyHandler);
  fastify.post("/reports/export",  { preHandler: auth }, reportsController.exportHandler);
}
