import { FastifyRequest, FastifyReply } from "fastify";
import { verifyAccessToken, JwtPayload } from "../utils/jwt";

declare module "fastify" {
  interface FastifyRequest {
    jwtPayload?: JwtPayload;
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const auth = request.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    void reply.status(401).send({ error: "Token requerido", code: "UNAUTHORIZED" });
    return;
  }
  try {
    request.jwtPayload = verifyAccessToken(auth.slice(7));
  } catch {
    void reply.status(401).send({ error: "Token inválido o expirado", code: "UNAUTHORIZED" });
    return;
  }
}
