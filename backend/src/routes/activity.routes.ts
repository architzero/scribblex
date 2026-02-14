import { FastifyInstance } from "fastify";
import prisma from "../prisma";
import { authenticate } from "../middleware/authenticate";

export async function activityRoutes(app: FastifyInstance) {
  // Activity routes removed - no Activity model in current schema
  // Will be re-implemented when activity tracking is needed
}
