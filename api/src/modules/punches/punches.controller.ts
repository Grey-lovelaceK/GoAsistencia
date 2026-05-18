import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import * as punchesService from "./punches.service";
import { AppError, Errors } from "../../utils/errors";

const createPunchSchema = z.object({
  siteId:           z.string().uuid(),
  type:             z.enum(["entrada", "salida_colacion", "entrada_colacion", "salida"]),
  timestamp:        z.string().min(1),
  deviceId:         z.string().min(1),
  photoKey:         z.string().optional(),
  webAuthnToken:    z.string().optional(),
  latitude:         z.number().optional(),
  longitude:        z.number().optional(),
  distanceMeters:   z.number().min(0).optional(),
  isWithinGeofence: z.boolean().optional(),
});

export function uploadUrlHandler(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send(punchesService.getUploadUrl());
}

export async function createHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = createPunchSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({ error: "Datos inválidos", details: parsed.error.flatten() });
  }
  try {
    const payload = request.jwtPayload!;
    if (!payload.empresaId) throw Errors.forbidden("Sin empresa asignada");

    const result = await punchesService.createPunch(
      parsed.data,
      payload.sub,
      payload.empresaId,
      payload.role ?? "colaborador"
    );
    return reply.status(201).send(result);
  } catch (err) {
    if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message, code: err.code });
    throw err;
  }
}

export async function listHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const payload = request.jwtPayload!;
    if (!payload.empresaId) throw Errors.forbidden("Sin empresa asignada");

    const q     = request.query as { limit?: string };
    const limit = q.limit ? Math.min(parseInt(q.limit, 10) || 20, 100) : 20;

    const result = await punchesService.getPunches(payload.sub, payload.empresaId, limit);
    return reply.send(result);
  } catch (err) {
    if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message, code: err.code });
    throw err;
  }
}
