import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import * as devicesService from "./devices.service";
import { AppError, Errors } from "../../utils/errors";
import type { JwtPayload } from "../../utils/jwt";

const registerSchema = z.object({
  deviceId:  z.string().min(1),
  tipo:      z.enum(["tablet", "mobile"]),
  nombre:    z.string().optional(),
  sitioId:   z.string().uuid().optional(),
  usuarioId: z.string().uuid().optional(),
  empresaId: z.string().uuid().optional(), // requerido solo para platform_admin
});

const authorizeSchema = z.object({
  deviceId:  z.string().min(1),
  tipo:      z.enum(["tablet", "mobile"]).optional(),
  nombre:    z.string().optional(),
  empresaId: z.string().uuid().optional(), // para platform_admin
});

function resolveEmpresaId(payload: JwtPayload, bodyEmpresaId?: string): string {
  if (payload.isPlatformAdmin) {
    if (!bodyEmpresaId) throw Errors.badRequest("Platform admin debe especificar empresaId en el body");
    return bodyEmpresaId;
  }
  if (!payload.empresaId) throw Errors.forbidden("Sin empresa asignada");
  return payload.empresaId;
}

export async function registerHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = registerSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({ error: "Datos inválidos", details: parsed.error.flatten() });
  }
  try {
    const payload    = request.jwtPayload!;
    const empresaId  = resolveEmpresaId(payload, parsed.data.empresaId);
    const result     = await devicesService.registerDeviceRequest(parsed.data, empresaId);
    return reply.status(201).send(result);
  } catch (err) {
    if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message, code: err.code });
    throw err;
  }
}

export async function authorizeHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = authorizeSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({ error: "Datos inválidos", details: parsed.error.flatten() });
  }
  try {
    const payload   = request.jwtPayload!;
    const empresaId = resolveEmpresaId(payload, parsed.data.empresaId);
    const result    = await devicesService.authorizeDevice(parsed.data, empresaId);
    return reply.send(result);
  } catch (err) {
    if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message, code: err.code });
    throw err;
  }
}

export async function listHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const payload   = request.jwtPayload!;
    const q         = request.query as { empresaId?: string };
    const empresaId = resolveEmpresaId(payload, q.empresaId);
    const result    = await devicesService.getDevices(empresaId);
    return reply.send(result);
  } catch (err) {
    if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message, code: err.code });
    throw err;
  }
}
