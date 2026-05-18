import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import * as authService from "./auth.service";
import { AppError } from "../../utils/errors";

const loginSchema = z.object({
  identifier: z.string().min(1, "Identificador requerido"),
  password:   z.string().min(1, "Contraseña requerida"),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, "refreshToken requerido"),
});

export async function loginHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = loginSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({ error: "Datos inválidos", details: parsed.error.flatten() });
  }
  try {
    const response = await authService.login(parsed.data);
    return reply.status(200).send(response);
  } catch (err) {
    if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message, code: err.code });
    throw err;
  }
}

export async function refreshHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = refreshSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({ error: "refreshToken requerido" });
  }
  try {
    const response = await authService.refresh(parsed.data.refreshToken);
    return reply.status(200).send(response);
  } catch (err) {
    if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message, code: err.code });
    throw err;
  }
}

export async function meHandler(request: FastifyRequest, reply: FastifyReply) {
  const payload = request.jwtPayload!;
  try {
    const user = await authService.getMe(payload.sub, !!payload.isPlatformAdmin);
    return reply.status(200).send({ user });
  } catch (err) {
    if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message, code: err.code });
    throw err;
  }
}
