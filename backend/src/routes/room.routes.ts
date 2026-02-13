import { FastifyInstance } from "fastify";
import prisma from "../prisma";
import { authenticate } from "../middleware/authenticate";

export async function roomRoutes(app: FastifyInstance) {

  /* ============================
     CREATE ROOM
  ============================ */

  app.post(
    "/rooms",
    { preHandler: authenticate },
    async (request: any, reply) => {
      const { name, isPublic, color, description } = request.body;
      const userId = request.user.userId;

      if (!name || name.trim().length === 0) {
        return reply.status(400).send({ message: "Room name required" });
      }

      if (name.length > 100) {
        return reply.status(400).send({ message: "Room name too long" });
      }

      // Random color if not provided
      const colors = [
        "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", 
        "#10b981", "#06b6d4", "#f43f5e", "#a855f7"
      ];
      const roomColor = color || colors[Math.floor(Math.random() * colors.length)];

      const room = await prisma.room.create({
        data: {
          name: name.trim(),
          isPublic: isPublic ?? true,
          color: roomColor,
          description: description?.trim(),

          owner: {
            connect: { id: userId },
          },

          members: {
            create: {
              userId: userId,
              role: "OWNER",
              isOnline: true,
            },
          },
        },
        include: {
          members: {
            include: {
              user: { select: { name: true, email: true, avatarUrl: true } },
            },
          },
        },
      });

      // Create activity
      await prisma.activity.create({
        data: {
          type: "ROOM_CREATED",
          message: `created room "${room.name}"`,
          roomId: room.id,
          userId: userId,
        },
      });

      return reply.send(room);
    }
  );

  /* ============================
     LIST ROOMS
  ============================ */

  app.get(
    "/rooms",
    { preHandler: authenticate },
    async (request: any) => {
      const userId = request.user.userId;

      const rooms = await prisma.room.findMany({
        where: {
          members: {
            some: {
              userId,
            },
          },
        },
        include: {
          owner: { select: { name: true, email: true, avatarUrl: true } },
          members: {
            include: {
              user: { select: { name: true, email: true, avatarUrl: true, lastActive: true } },
            },
          },
          _count: {
            select: { members: true },
          },
        },
        orderBy: { lastActivity: "desc" },
      });

      // Calculate online members
      const roomsWithOnline = rooms.map(room => ({
        ...room,
        onlineCount: room.members.filter(m => 
          m.isOnline && 
          new Date(m.lastSeen).getTime() > Date.now() - 5 * 60 * 1000
        ).length,
      }));

      return roomsWithOnline;
    }
  );

}
