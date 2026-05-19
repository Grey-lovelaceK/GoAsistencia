import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./config/env";
import { AppError } from "./utils/errors";
import { getPool } from "./config/db";
import { authRoutes } from "./modules/auth/auth.routes";
import { employeesRoutes } from "./modules/employees/employees.routes";
import { sitesRoutes } from "./modules/sites/sites.routes";
import { shiftGroupsRoutes } from "./modules/shift-groups/shift-groups.routes";
import { punchPoliciesRoutes } from "./modules/punch-policies/punch-policies.routes";
// Fase 3
import { devicesRoutes } from "./modules/devices/devices.routes";
import { punchesRoutes } from "./modules/punches/punches.routes";
import { reportsRoutes } from "./modules/reports/reports.routes";
// Fase 6B
import { exceptionsRoutes } from "./modules/exceptions/exceptions.routes";
import { empresasRoutes } from "./modules/empresas/empresas.routes";

export async function buildApp() {
  const app = Fastify({
    logger: { level: env.NODE_ENV !== "production" ? "info" : "warn" },
  });

  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ error: error.message, code: error.code });
    }
    app.log.error(error);
    return reply.status(500).send({ error: "Error interno del servidor", code: "INTERNAL_ERROR" });
  });

  app.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "2.0.0",
  }));

  app.get("/health/db", async (_request, reply) => {
    try {
      await getPool().query("SELECT NOW()");
      return reply.send({ status: "ok", database: "connected" });
    } catch (err) {
      console.error("[Health] DB check failed:", err);
      return reply.status(503).send({
        status: "error",
        database: "disconnected",
        message: "No se pudo conectar con PostgreSQL",
      });
    }
  });

  const V1 = { prefix: "/v1" };
  await app.register(authRoutes,          V1);
  await app.register(employeesRoutes,     V1);
  await app.register(sitesRoutes,         V1);
  await app.register(shiftGroupsRoutes,   V1);
  await app.register(punchPoliciesRoutes, V1);
  await app.register(devicesRoutes,       V1);
  await app.register(punchesRoutes,       V1);
  await app.register(reportsRoutes,       V1);
  await app.register(exceptionsRoutes,    V1);
  await app.register(empresasRoutes,      V1);

  return app;
}
