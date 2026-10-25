import type { FastifyReply } from "fastify";

export function sendError(
  reply: FastifyReply,
  statusCode: number,
  message: string,
  details?: unknown,
) {
  return reply.code(statusCode).send({
    error: message,
    statusCode,
    ...(details ? { details } : {}),
  });
}

export function sendSuccess<T>(reply: FastifyReply, data: T, statusCode = 200) {
  return reply.code(statusCode).send(data);
}
