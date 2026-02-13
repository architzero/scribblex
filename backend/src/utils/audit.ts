import prisma from "../prisma";
import { FastifyRequest } from "fastify";

export async function logAudit(
  action: string,
  request: FastifyRequest,
  userId?: string,
  metadata?: any
) {
  const ipAddress = request.ip || "unknown";
  const userAgent = request.headers["user-agent"] || "unknown";

  await prisma.auditLog.create({
    data: {
      userId,
      action,
      ipAddress,
      userAgent,
      metadata: metadata || {},
    },
  });
}
