import { FastifyInstance } from "fastify";
import prisma from "../prisma";
import { authenticate } from "../middleware/authenticate";

export async function activityRoutes(app: FastifyInstance) {

  /* ============================
     GET ACTIVITIES (Activity Stream)
  ============================ */

  app.get(
    "/activities",
    { preHandler: authenticate },
    async (request: any) => {
      const activities = await prisma.activity.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true, avatarUrl: true } },
          room: { select: { name: true, color: true } },
        },
      });
      return activities;
    }
  );

  /* ============================
     GET ONLINE USERS
  ============================ */

  app.get(
    "/users/online",
    { preHandler: authenticate },
    async (request: any) => {
      const onlineUsers = await prisma.roomMember.findMany({
        where: {
          isOnline: true,
          lastSeen: {
            gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
          },
        },
        include: {
          user: { select: { name: true, email: true, avatarUrl: true } },
          room: { select: { name: true, color: true } },
        },
      });
      return onlineUsers;
    }
  );

}
