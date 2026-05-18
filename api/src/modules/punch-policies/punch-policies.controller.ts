import { FastifyRequest, FastifyReply } from "fastify";
import * as punchPoliciesService from "./punch-policies.service";
import { AppError, Errors } from "../../utils/errors";

export async function listHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const payload = request.jwtPayload!;
    if (!payload.empresaId) throw Errors.forbidden("Sin empresa asignada");
    const siteId = (request.query as { siteId?: string }).siteId ?? null;
    const result = await punchPoliciesService.getPunchPolicies(payload.empresaId, siteId);
    return reply.send(result);
  } catch (err) {
    if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message, code: err.code });
    throw err;
  }
}
