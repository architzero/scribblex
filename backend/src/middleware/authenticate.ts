import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import prisma from "../prisma";

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      userId: string;
      email: string;
      username: string;
      tokenVersion: number;
    };
  }
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({ success: false, message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      userId: string;
      email: string;
      username: string;
      tokenVersion: number;
    };

    // Verify user exists and token version matches
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, tokenVersion: true, isActive: true, profileCompleted: true }
    });

    if (!user || !user.isActive) {
      return reply.status(401).send({ success: false, message: "User not found or inactive" });
    }

    if (user.tokenVersion !== decoded.tokenVersion) {
      return reply.status(401).send({ success: false, message: "Token invalidated" });
    }

    // Attach user to request
    request.user = {
      id: decoded.userId,
      userId: decoded.userId,
      email: decoded.email,
      username: decoded.username,
      tokenVersion: decoded.tokenVersion
    };

  } catch (err) {
    return reply.status(401).send({ success: false, message: "Invalid or expired token" });
  }
}
