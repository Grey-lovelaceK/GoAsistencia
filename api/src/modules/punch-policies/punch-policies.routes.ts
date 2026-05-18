import { FastifyInstance } from "fastify";
import { authMiddleware } from "../../middleware/auth.middleware";
import * as punchPoliciesController from "./punch-policies.controller";

export async function punchPoliciesRoutes(fastify: FastifyInstance) {
  fastify.get("/punch-policies", { preHandler: [authMiddleware] }, punchPoliciesController.listHandler);
}
