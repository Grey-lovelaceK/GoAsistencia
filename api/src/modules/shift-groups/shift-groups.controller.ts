import { FastifyRequest, FastifyReply } from "fastify";
import * as shiftGroupsService from "./shift-groups.service";
import { AppError, Errors } from "../../utils/errors";

function resolveEmpresaId(request: FastifyRequest): string {
  const payload = request.jwtPayload!;
  if (payload.isPlatformAdmin) {
    const qs = request.query as Record<string, string>;
    const id = qs.empresaId;
    if (!id) throw Errors.badRequest("empresaId requerido (query param)");
    return id;
  }
  if (!payload.empresaId) throw Errors.forbidden("Sin empresa asignada");
  return payload.empresaId;
}

export async function listHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const empresaId = resolveEmpresaId(request);
    const result = await shiftGroupsService.getShiftGroups(empresaId);
    return reply.send(result);
  } catch (err) {
    if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message, code: err.code });
    throw err;
  }
}

export async function meHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const empresaId = resolveEmpresaId(request);
    const payload = request.jwtPayload!;
    const result = await shiftGroupsService.getMyShiftGroup(payload.sub, empresaId);
    return reply.send(result);
  } catch (err) {
    if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message, code: err.code });
    throw err;
  }
}
