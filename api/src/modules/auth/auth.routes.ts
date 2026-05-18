import { FastifyInstance } from "fastify";
import { authMiddleware } from "../../middleware/auth.middleware";
import * as authController from "./auth.controller";

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/auth/login",   authController.loginHandler);
  fastify.post("/auth/refresh", authController.refreshHandler);
  fastify.get("/auth/me",       { preHandler: [authMiddleware] }, authController.meHandler);
}
