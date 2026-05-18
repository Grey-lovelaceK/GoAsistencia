import { FastifyInstance } from "fastify";
import { authMiddleware } from "../../middleware/auth.middleware";
import * as shiftGroupsController from "./shift-groups.controller";

export async function shiftGroupsRoutes(fastify: FastifyInstance) {
  const auth = [authMiddleware];
  fastify.get("/shift-groups",    { preHandler: auth }, shiftGroupsController.listHandler);
  fastify.get("/shift-groups/me", { preHandler: auth }, shiftGroupsController.meHandler);
}
