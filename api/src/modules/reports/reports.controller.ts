import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import * as reportsService from "./reports.service";
import { AppError, Errors } from "../../utils/errors";
import type { JwtPayload } from "../../utils/jwt";

const filtersSchema = z.object({
  from:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD requerido").optional(),
  to:           z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD requerido").optional(),
  siteId:       z.string().uuid().optional(),
  employeeId:   z.string().uuid().optional(),
  supervisorId: z.string().uuid().optional(),
  status:       z.enum(["on_time", "late", "absent", "overtime"]).optional(),
  empresaId:    z.string().uuid().optional(), // para platform_admin
});

function resolveEmpresaId(payload: JwtPayload, queryEmpresaId?: string): string {
  if (payload.isPlatformAdmin) {
    if (!queryEmpresaId) throw Errors.badRequest("Platform admin debe especificar empresaId en los parámetros");
    return queryEmpresaId;
  }
  if (!payload.empresaId) throw Errors.forbidden("Sin empresa asignada");
  return payload.empresaId;
}

export async function dailyHandler(request: FastifyRequest, reply: FastifyReply) {
  const q = request.query as Record<string, string | undefined>;
  // Strip empty strings so Zod .optional() fields handle them as absent
  const cleaned = Object.fromEntries(
    Object.entries(q).map(([k, v]) => [k, v === "" ? undefined : v])
  );
  const parsed = filtersSchema.safeParse(cleaned);
  if (!parsed.success) {
    return reply.status(400).send({ error: "Parámetros inválidos", details: parsed.error.flatten() });
  }
  try {
    const payload   = request.jwtPayload!;
    const empresaId = resolveEmpresaId(payload, parsed.data.empresaId);

    const result = await reportsService.getDailyReports({
      empresaId,
      role:           payload.role,
      userId:         payload.sub,
      isPlatformAdmin: !!payload.isPlatformAdmin,
      filters: {
        from:         parsed.data.from,
        to:           parsed.data.to,
        siteId:       parsed.data.siteId,
        employeeId:   parsed.data.employeeId,
        supervisorId: parsed.data.supervisorId,
        status:       parsed.data.status,
      },
    });
    return reply.send(result);
  } catch (err) {
    if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message, code: err.code });
    throw err;
  }
}

export async function exportHandler(request: FastifyRequest, reply: FastifyReply) {
  const q = request.query as Record<string, string | undefined>;
  const cleaned = Object.fromEntries(
    Object.entries(q).map(([k, v]) => [k, v === "" ? undefined : v])
  );
  const parsed = filtersSchema.safeParse(cleaned);
  if (!parsed.success) {
    return reply.status(400).send({ error: "Parámetros inválidos", details: parsed.error.flatten() });
  }
  try {
    const payload = request.jwtPayload!;
    resolveEmpresaId(payload, parsed.data.empresaId); // valida acceso

    const result = reportsService.exportReports({
      from:         parsed.data.from,
      to:           parsed.data.to,
      siteId:       parsed.data.siteId,
      employeeId:   parsed.data.employeeId,
      supervisorId: parsed.data.supervisorId,
      status:       parsed.data.status,
    });
    return reply.send(result);
  } catch (err) {
    if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message, code: err.code });
    throw err;
  }
}
