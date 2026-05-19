import { FastifyInstance } from "fastify";
import { query, dbError } from "../../config/db";
import { authMiddleware } from "../../middleware/auth.middleware";
import { AppError, Errors } from "../../utils/errors";

export async function empresasRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/empresas",
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      try {
        const payload = request.jwtPayload!;
        if (!payload.isPlatformAdmin) throw Errors.forbidden("Solo platform_admin");

        const rows = await query<{ id: string; nombre: string; rut: string | null; activo: boolean }>(
          `SELECT id, nombre, rut, activo FROM empresas WHERE activo = true ORDER BY nombre`,
          []
        ).catch((err: unknown) => dbError(err, "empresas.list"));

        return reply.send({ empresas: rows });
      } catch (err) {
        if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message, code: err.code });
        throw err;
      }
    }
  );
}
