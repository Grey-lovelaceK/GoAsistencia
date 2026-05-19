import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import * as employeesService from "./employees.service";
import { AppError, Errors } from "../../utils/errors";

const createSchema = z.object({
  rut:          z.string().min(1),
  name:         z.string().min(1),
  email:        z.string().email(),
  password:     z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  role:         z.enum(["colaborador", "supervisor", "rrhh", "gerencia"]),
  siteId:       z.string().uuid().nullable().optional(),
  supervisorId: z.string().uuid().nullable().optional(),
  grupoTurnoId: z.string().uuid().nullable().optional(),
  empresaId:    z.string().uuid().optional(),
});

const updateSchema = z.object({
  name:         z.string().min(1).optional(),
  email:        z.string().email().optional(),
  rut:          z.string().optional(),
  role:         z.enum(["colaborador", "supervisor", "rrhh", "gerencia"]).optional(),
  siteId:       z.string().uuid().nullable().optional(),
  supervisorId: z.string().uuid().nullable().optional(),
  status:       z.enum(["activo", "inactivo"]).optional(),
  grupoTurnoId: z.string().uuid().nullable().optional(),
  empresaId:    z.string().uuid().optional(),
});

function resolveEmpresaId(request: FastifyRequest): string | null {
  const payload = request.jwtPayload!;
  if (payload.isPlatformAdmin) {
    const qs   = request.query as Record<string, string>;
    const body = (request.body ?? {}) as Record<string, unknown>;
    return (body.empresaId as string | undefined) ?? qs.empresaId ?? null;
  }
  if (!payload.empresaId) throw Errors.forbidden("Sin empresa asignada");
  return payload.empresaId;
}

export async function listHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const empresaId  = resolveEmpresaId(request);
    const payload    = request.jwtPayload!;
    const supervisorId = payload.role === "supervisor" ? payload.sub : undefined;
    const result = await employeesService.getEmployees({ empresaId, supervisorId });
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
    const payload    = request.jwtPayload!;
    let empresaId = resolveEmpresaId(request);
    if (!empresaId && payload.isPlatformAdmin) {
      empresaId = parsed.data.empresaId ?? null;
    }
    if (!empresaId) throw Errors.badRequest("empresaId es requerido");
    const { empresaId: _ignored, ...rest } = parsed.data;
    const employee = await employeesService.createEmployee({ empresaId, ...rest });
    return reply.status(201).send(employee);
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
    const payload    = request.jwtPayload!;
    let empresaId = resolveEmpresaId(request);
    if (!empresaId && payload.isPlatformAdmin) {
      empresaId = parsed.data.empresaId ?? null;
    }
    const { empresaId: _ignored, ...rest } = parsed.data;
    const result = await employeesService.updateEmployee(id, empresaId, rest);
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
    const result = await employeesService.deleteEmployee(id, empresaId);
    return reply.send(result);
  } catch (err) {
    if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message, code: err.code });
    throw err;
  }
}
