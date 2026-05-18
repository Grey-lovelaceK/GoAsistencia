export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code: string = "APP_ERROR"
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const Errors = {
  badRequest:   (msg = "Solicitud inválida")           => new AppError(400, msg, "BAD_REQUEST"),
  unauthorized: (msg = "No autorizado")                => new AppError(401, msg, "UNAUTHORIZED"),
  forbidden:    (msg = "Acceso denegado")              => new AppError(403, msg, "FORBIDDEN"),
  notFound:     (msg = "Recurso no encontrado")        => new AppError(404, msg, "NOT_FOUND"),
  conflict:     (msg = "Conflicto de datos")           => new AppError(409, msg, "CONFLICT"),
  internal:     (msg = "Error interno del servidor")   => new AppError(500, msg, "INTERNAL_ERROR"),
};

export function handleError(
  err: unknown,
  reply: { status: (code: number) => { send: (body: unknown) => unknown } }
) {
  if (err instanceof AppError) {
    return reply.status(err.statusCode).send({ error: err.message, code: err.code });
  }
  throw err;
}
