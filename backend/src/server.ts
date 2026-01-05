import Fastify from "fastify";
import dotenv from "dotenv";
import prisma from "./prisma";

dotenv.config();

const server = Fastify({ logger: true });

server.get("/health", async () => {
  return { status: "ok" };
});

server.get("/db-test", async () => {
  const count = await prisma.user.count();
  return { users: count };
});

const start = async () => {
  try {
    await server.ready();

    // 🔥 FORCE PRINT ROUTES (CRITICAL)
    console.log(server.printRoutes());

    await server.listen({ port: 4000, host: "0.0.0.0" });
    console.log("Server started");
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
