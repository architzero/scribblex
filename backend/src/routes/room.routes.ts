import { FastifyInstance } from "fastify";
import prisma from "../prisma";
import { authenticate } from "../middleware/authenticate";

export async function roomRoutes(app: FastifyInstance) {

  /* ============================
     POST /rooms - Create Room
  ============================ */

  app.post(
    "/rooms",
    { preHandler: authenticate },
    async (request: any, reply) => {
      try {
        const { title, description, visibility } = request.body;
        const userId = request.user.userId;

        if (!title || title.trim().length === 0) {
          return reply.status(400).send({ message: "Title is required" });
        }

        // Create room and add creator as HOST in one transaction
        const room = await prisma.room.create({
          data: {
            title: title.trim(),
            description: description?.trim() || null,
            visibility: visibility || "PUBLIC",
            createdBy: userId,
            participants: {
              create: {
                userId: userId,
                role: "HOST",
              },
            },
          },
          include: {
            creator: {
              select: { id: true, name: true, email: true, username: true, avatarUrl: true },
            },
            participants: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, username: true, avatarUrl: true },
                },
              },
            },
          },
        });

        return reply.status(201).send(room);
      } catch (error) {
        console.error("Create room error:", error);
        return reply.status(500).send({ message: "Failed to create room" });
      }
    }
  );

  /* ============================
     GET /rooms - List User's Rooms
  ============================ */

  app.get(
    "/rooms",
    { preHandler: authenticate },
    async (request: any, reply) => {
      try {
        const userId = request.user.userId;

        const rooms = await prisma.room.findMany({
          where: {
            isActive: true,
            participants: {
              some: {
                userId: userId,
              },
            },
          },
          include: {
            creator: {
              select: { id: true, name: true, email: true, username: true, avatarUrl: true },
            },
            _count: {
              select: { participants: true },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        return reply.send(rooms);
      } catch (error) {
        console.error("List rooms error:", error);
        return reply.status(500).send({ message: "Failed to fetch rooms" });
      }
    }
  );

  /* ============================
     GET /rooms/:id - Fetch Room
  ============================ */

  app.get(
    "/rooms/:id",
    { preHandler: authenticate },
    async (request: any, reply) => {
      try {
        const { id } = request.params;
        const userId = request.user.userId;

        const room = await prisma.room.findUnique({
          where: { id },
          include: {
            creator: {
              select: { id: true, name: true, email: true, username: true, avatarUrl: true },
            },
            participants: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, username: true, avatarUrl: true },
                },
              },
            },
          },
        });

        if (!room || !room.isActive) {
          return reply.status(404).send({ message: "Room not found" });
        }

        // Check access: public rooms or participant
        const isParticipant = room.participants.some(p => p.userId === userId);
        if (room.visibility === "PRIVATE" && !isParticipant) {
          return reply.status(403).send({ message: "Access denied" });
        }

        return reply.send(room);
      } catch (error) {
        console.error("Get room error:", error);
        return reply.status(500).send({ message: "Failed to fetch room" });
      }
    }
  );

  /* ============================
     POST /rooms/:id/join - Join Room
  ============================ */

  app.post(
    "/rooms/:id/join",
    { preHandler: authenticate },
    async (request: any, reply) => {
      try {
        const { id } = request.params;
        const userId = request.user.userId;

        // Check if room exists and is active
        const room = await prisma.room.findUnique({
          where: { id },
          select: { id: true, visibility: true, isActive: true },
        });

        if (!room || !room.isActive) {
          return reply.status(404).send({ message: "Room not found" });
        }

        if (room.visibility === "PRIVATE") {
          return reply.status(403).send({ message: "Cannot join private room" });
        }

        // Check if already a participant
        const existingParticipant = await prisma.roomParticipant.findUnique({
          where: {
            roomId_userId: {
              roomId: id,
              userId: userId,
            },
          },
        });

        if (existingParticipant) {
          return reply.status(200).send({ message: "Already joined" });
        }

        // Add as participant
        await prisma.roomParticipant.create({
          data: {
            roomId: id,
            userId: userId,
            role: "PARTICIPANT",
          },
        });

        return reply.status(200).send({ message: "Joined successfully" });
      } catch (error) {
        console.error("Join room error:", error);
        return reply.status(500).send({ message: "Join failed" });
      }
    }
  );

  /* ============================
     PATCH /rooms/:id - Update Room
  ============================ */

  app.patch(
    "/rooms/:id",
    { preHandler: authenticate },
    async (request: any, reply) => {
      try {
        const { id } = request.params;
        const { title, description, visibility, thumbnail } = request.body;
        const userId = request.user.userId;

        const room = await prisma.room.findUnique({
          where: { id },
          select: { createdBy: true },
        });

        if (!room) {
          return reply.status(404).send({ message: "Room not found" });
        }

        if (room.createdBy !== userId) {
          return reply.status(403).send({ message: "Only room creator can update" });
        }

        const updated = await prisma.room.update({
          where: { id },
          data: {
            ...(title && { title: title.trim() }),
            ...(description !== undefined && { description: description?.trim() || null }),
            ...(visibility && { visibility }),
            ...(thumbnail !== undefined && { thumbnail }),
          },
          include: {
            creator: {
              select: { id: true, name: true, username: true, avatarUrl: true },
            },
            _count: {
              select: { participants: true },
            },
          },
        });

        return reply.send(updated);
      } catch (error) {
        console.error("Update room error:", error);
        return reply.status(500).send({ message: "Failed to update room" });
      }
    }
  );

  /* ============================
     DELETE /rooms/:id - Delete Room
  ============================ */

  app.delete(
    "/rooms/:id",
    { preHandler: authenticate },
    async (request: any, reply) => {
      try {
        const { id } = request.params;
        const userId = request.user.userId;

        const room = await prisma.room.findUnique({
          where: { id },
          select: { createdBy: true },
        });

        if (!room) {
          return reply.status(404).send({ message: "Room not found" });
        }

        if (room.createdBy !== userId) {
          return reply.status(403).send({ message: "Only room creator can delete" });
        }

        await prisma.room.update({
          where: { id },
          data: { isActive: false },
        });

        return reply.send({ message: "Room deleted successfully" });
      } catch (error) {
        console.error("Delete room error:", error);
        return reply.status(500).send({ message: "Failed to delete room" });
      }
    }
  );

}
