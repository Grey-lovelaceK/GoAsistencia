import { FastifyRequest, FastifyReply } from "fastify";
import * as sitesService from "./sites.service";
import type { CreateSiteData, UpdateSiteData } from "./sites.service";
import { AppError, Errors } from "../../utils/errors";

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
    const empresaId = resolveEmpresaId(request);
    const result = await sitesService.getSites(empresaId);
    return reply.send(result);
  } catch (err) {
    if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message, code: err.code });
    throw err;
  }
}

export async function getOneHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  try {
    const empresaId = resolveEmpresaId(request);
    if (!empresaId) throw Errors.badRequest("empresaId requerido para obtener sitio individual");
    const site = await sitesService.getSite(id, empresaId);
    return reply.send(site);
  } catch (err) {
    if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message, code: err.code });
    throw err;
  }
}

export async function createHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    let empresaId = resolveEmpresaId(request);
    if (!empresaId) {
      const body = request.body as Record<string, unknown>;
      empresaId  = (body.empresaId as string | undefined) ?? null;
    }
    if (!empresaId) throw Errors.badRequest("empresaId es requerido");
    const body = request.body as Record<string, unknown>;

    const name    = typeof body.name    === "string" ? body.name.trim()    : "";
    const address = typeof body.address === "string" ? body.address.trim() : "";
    const lat     = typeof body.lat     === "number" ? body.lat            : parseFloat(String(body.lat ?? ""));
    const lng     = typeof body.lng     === "number" ? body.lng            : parseFloat(String(body.lng ?? ""));
    const radius  = typeof body.radiusMeters === "number" ? body.radiusMeters : parseInt(String(body.radiusMeters ?? "500"), 10);

    if (!name)          throw Errors.badRequest("nombre es requerido");
    if (!address)       throw Errors.badRequest("direccion es requerida");
    if (isNaN(lat))     throw Errors.badRequest("lat debe ser un número");
    if (isNaN(lng))     throw Errors.badRequest("lng debe ser un número");
    if (isNaN(radius) || radius <= 0) throw Errors.badRequest("radiusMeters debe ser mayor que 0");

    const data: CreateSiteData = {
      name,
      address,
      lat,
      lng,
      radiusMeters: radius,
      timezone: typeof body.timezone === "string" ? body.timezone : undefined,
    };

    const site = await sitesService.createSite(empresaId, data);
    return reply.status(201).send(site);
  } catch (err) {
    if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message, code: err.code });
    throw err;
  }
}

export async function updateHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  try {
    let empresaId = resolveEmpresaId(request);
    if (!empresaId) {
      const body = request.body as Record<string, unknown>;
      empresaId  = (body.empresaId as string | undefined) ?? null;
    }
    if (!empresaId) throw Errors.badRequest("empresaId es requerido");
    const body = request.body as Record<string, unknown>;

    const data: UpdateSiteData = {};
    if (typeof body.name         === "string")  data.name         = body.name.trim();
    if (typeof body.address      === "string")  data.address      = body.address.trim();
    if (typeof body.lat          === "number")  data.lat          = body.lat;
    if (typeof body.lng          === "number")  data.lng          = body.lng;
    if (typeof body.radiusMeters === "number")  data.radiusMeters = body.radiusMeters;
    if (typeof body.timezone     === "string")  data.timezone     = body.timezone;
    if (typeof body.active       === "boolean") data.active       = body.active;

    const site = await sitesService.updateSite(id, empresaId, data);
    return reply.send(site);
  } catch (err) {
    if (err instanceof AppError) return reply.status(err.statusCode).send({ error: err.message, code: err.code });
    throw err;
  }
}
