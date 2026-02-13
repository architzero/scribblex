import Fastify from "fastify";
import { env } from "./config/env";
import { registerPlugins } from "./plugins";
import { registerWebsocket } from "./plugins/websocket";
import { authenticate } from "./middleware/authenticate";
import { authRoutes } from "./routes/auth.routes";
import { roomRoutes } from "./routes/room.routes";
import { activityRoutes } from "./routes/activity.routes";
import { profileRoutes } from "./routes/profile.routes";
import { userRoutes } from "./routes/user.routes";

import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";

async function buildServer() {
  const server = Fastify({
    logger: true,
    bodyLimit: 1048576,
  });

  // Register all shared plugins (cors, cookie, helmet, etc.)
  await registerPlugins(server);

  // Basic routes
  server.get("/health", async () => {
    return { status: "ok" };
  });

  server.get(
    "/protected",
    { preHandler: authenticate },
    async (request: any) => {
      return {
        message: "You are authenticated",
        user: request.user,
      };
    }
  );

  // WebSocket
  await registerWebsocket(server);

  // Routes
  await server.register(authRoutes);
  await server.register(userRoutes, { prefix: '/user' });
  await server.register(profileRoutes);
  await server.register(roomRoutes);
  await server.register(activityRoutes);

  // Global error handler
  server.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        success: false,
        message: "Validation error",
      });
    }

    if (error instanceof TokenExpiredError) {
      return reply.status(401).send({
        success: false,
        message: "Token expired",
      });
    }

    if (error instanceof JsonWebTokenError) {
      return reply.status(401).send({
        success: false,
        message: "Invalid token",
      });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return reply.status(409).send({
          success: false,
          message: "Resource already exists",
        });
      }

      if (error.code === "P2025") {
        return reply.status(404).send({
          success: false,
          message: "Resource not found",
        });
      }
    }

    if ((error as any).statusCode === 413) {
      return reply.status(413).send({
        success: false,
        message: "Request body too large",
      });
    }

    server.log.error(error);

    return reply.status(500).send({
      success: false,
      message:
        env.NODE_ENV === "production"
          ? "Internal server error"
          : error.message,
    });
  });

  return server;
}

async function start() {
  try {
    const server = await buildServer();

    await server.listen({
      port: 4000,
      host: "0.0.0.0",
    });

    console.log("\n✅ Server started on http://localhost:4000\n");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

start();
