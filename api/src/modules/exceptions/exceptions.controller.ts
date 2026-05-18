import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import * as exceptionsService from "./exceptions.service";
import { AppError, Errors } from "../../utils/errors";
import type { DbException } from "./exceptions.types";

const createSchema = z.object({
  type:        z.enum(["feriado", "vacaciones"]),
  title:       z.string().min(1),
  dateFrom:    z.string(),
  dateTo:      z.string(),
  employeeId:  z.string().uuid().nullable().optional(),
  description: z.string().optional(),
});

const updateSchema = z.object({
  type:        z.enum(["feriado", "vacaciones"]).optional(),
  title:       z.string().min(1).optional(),
  dateFrom:    z.string().optional(),
  dateTo:      z.string().optional(),
  description: z.string().optional(),
  employeeId:  z.string().uuid().nullable().optional(),
});

// platform_admin usa empresaId desde query (GET) o body (POST/PUT/DELETE).
// Usuarios normales usan empresaId del JWT.
function resolveEmpresaId(request: FastifyRequest): string {
  const payload = request.jwtPayload!;
  if (payload.isPlatformAdmin) {
    const qs   = request.query as Record<string, string>;
    const body = (request.body ?? {}) as Record<string, unknown>;
    const id   = (body.empresaId as string | undefined) ?? qs.empresaId;
    if (!id) throw Errors.forbidden("platform_admin requiere empresaId");
    return id;
  }
  if (!payload.empresaId) throw Errors.forbidden("Sin empresa asignada");
  return payload.empresaId;
}

export async function listHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const empresaId    = resolveEmpresaId(request);
    const payload      = request.jwtPayload!;
    const qs           = request.query as Record<string, string>;
    const supervisorId = payload.role === "supervisor" ? payload.sub : undefined;

    const result = await exceptionsService.getExceptions(empresaId, {
      supervisorId,
      type:       qs.type,
      year:       qs.year  ? Number(qs.year)  : undefined,
      month:      qs.month ? Number(qs.month) : undefined,
      employeeId: qs.employeeId,
    });
    return reply.send(result);
  } catch (err) {
    if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message, code: err.code });
    throw err;
  }
}

export async function createHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = createSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({ error: "Datos inválidos", details: parsed.error.flatten() });
  }
  try {
    const empresaId = resolveEmpresaId(request);
    const payload   = request.jwtPayload!;

    if (payload.role === "supervisor" && parsed.data.type === "feriado") {
      throw Errors.forbidden("Los supervisores no pueden crear feriados globales");
    }

    if (payload.role === "supervisor" && parsed.data.employeeId) {
      await exceptionsService.assertSupervisorScope(
        { usuario_id: parsed.data.employeeId } as DbException,
        payload.sub,
        empresaId
      );
    }

    const result = await exceptionsService.createException(parsed.data, empresaId);
    return reply.status(201).send(result);
  } catch (err) {
    if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message, code: err.code });
    throw err;
  }
}

export async function updateHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const parsed = updateSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({ error: "Datos inválidos", details: parsed.error.flatten() });
  }
  try {
    const empresaId = resolveEmpresaId(request);
    const payload   = request.jwtPayload!;

    if (payload.role === "supervisor") {
      // Supervisor no puede convertir una excepción en feriado global
      if (parsed.data.type === "feriado") {
        throw Errors.forbidden("Los supervisores no pueden crear feriados globales");
      }
      const exception = await exceptionsService.getExceptionById(id, empresaId);
      if (!exception) throw Errors.notFound("Excepción no encontrada");
      await exceptionsService.assertSupervisorScope(exception, payload.sub, empresaId);
    }

    const result = await exceptionsService.updateException(id, empresaId, parsed.data);
    return reply.send(result);
  } catch (err) {
    if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message, code: err.code });
    throw err;
  }
}

export async function deleteHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  try {
    const empresaId = resolveEmpresaId(request);
    const payload   = request.jwtPayload!;

    if (payload.role === "supervisor") {
      const exception = await exceptionsService.getExceptionById(id, empresaId);
      if (!exception) throw Errors.notFound("Excepción no encontrada");
      await exceptionsService.assertSupervisorScope(exception, payload.sub, empresaId);
    }

    const result = await exceptionsService.deleteException(id, empresaId);
    return reply.send(result);
  } catch (err) {
    if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message, code: err.code });
    throw err;
  }
}
