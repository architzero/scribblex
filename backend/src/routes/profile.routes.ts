import { FastifyInstance } from "fastify";
import prisma from "../prisma";
import { logAudit } from "../utils/audit";

export async function profileRoutes(app: FastifyInstance) {

  // =========================
  // SETUP PROFILE (First time)
  // =========================
  app.post("/profile/setup", async (request: any, reply) => {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({ success: false, message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    try {
      const jwt = require("jsonwebtoken");
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET);

      const { username, displayName, bio, role, skills, avatarUrl } = request.body;

      // Validate username
      if (!username || username.length < 3 || username.length > 20) {
        return reply.status(400).send({ success: false, message: "Username must be 3-20 characters" });
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return reply.status(400).send({ success: false, message: "Username can only contain letters, numbers, and underscores" });
      }

      // Validate bio (mandatory)
      if (!bio || bio.trim().length === 0) {
        return reply.status(400).send({ success: false, message: "Bio is required" });
      }

      // Check if username is taken
      const existingUser = await prisma.user.findUnique({ where: { username } });
      if (existingUser && existingUser.id !== decoded.userId) {
        return reply.status(400).send({ success: false, message: "Username already taken" });
      }

      // Update user profile
      const user = await prisma.user.update({
        where: { id: decoded.userId },
        data: {
          username,
          displayName: displayName || null,
          bio,
          role: role || "Creator",
          skills: skills || [],
          avatarUrl: avatarUrl || null,
          profileCompleted: true,
        },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          name: true,
          avatarUrl: true,
          bio: true,
          role: true,
          skills: true,
          profileCompleted: true,
        },
      });

      await logAudit("PROFILE_COMPLETED", request, decoded.userId);

      return reply.send({ success: true, user });
    } catch (error) {
      return reply.status(401).send({ success: false, message: "Invalid token" });
    }
  });

  // =========================
  // UPDATE PROFILE
  // =========================
  app.put("/profile/update", async (request: any, reply) => {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({ success: false, message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    try {
      const jwt = require("jsonwebtoken");
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET);

      const { username, displayName, bio, role, skills, avatarUrl } = request.body;

      // Validate username if provided
      if (username) {
        if (username.length < 3 || username.length > 20) {
          return reply.status(400).send({ success: false, message: "Username must be 3-20 characters" });
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
          return reply.status(400).send({ success: false, message: "Username can only contain letters, numbers, and underscores" });
        }

        // Check if username is taken
        const existingUser = await prisma.user.findUnique({ where: { username } });
        if (existingUser && existingUser.id !== decoded.userId) {
          return reply.status(400).send({ success: false, message: "Username already taken" });
        }
      }

      // Validate bio if provided
      if (bio !== undefined && bio.trim().length === 0) {
        return reply.status(400).send({ success: false, message: "Bio cannot be empty" });
      }

      // Update user profile
      const updateData: any = {};
      if (username !== undefined) updateData.username = username;
      if (displayName !== undefined) updateData.displayName = displayName || null;
      if (bio !== undefined) updateData.bio = bio;
      if (role !== undefined) updateData.role = role;
      if (skills !== undefined) updateData.skills = skills;
      if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

      const user = await prisma.user.update({
        where: { id: decoded.userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          name: true,
          avatarUrl: true,
          bio: true,
          role: true,
          skills: true,
          profileCompleted: true,
        },
      });

      await logAudit("PROFILE_UPDATED", request, decoded.userId);

      return reply.send({ success: true, user });
    } catch (error) {
      return reply.status(401).send({ success: false, message: "Invalid token" });
    }
  });

  // =========================
  // DELETE ACCOUNT
  // =========================
  app.delete("/profile/delete", async (request: any, reply) => {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({ success: false, message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    try {
      const jwt = require("jsonwebtoken");
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET);

      // Delete user (cascade will handle related records)
      await prisma.user.delete({
        where: { id: decoded.userId },
      });

      await logAudit("ACCOUNT_DELETED", request, decoded.userId);

      return reply.send({ success: true, message: "Account deleted successfully" });
    } catch (error) {
      return reply.status(500).send({ success: false, message: "Failed to delete account" });
    }
  });

  // =========================
  // CHECK USERNAME AVAILABILITY
  // =========================
  app.get("/profile/check-username/:username", async (request: any, reply) => {
    const { username } = request.params;

    if (!username || username.length < 3) {
      return reply.send({ available: false, message: "Too short" });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return reply.send({ available: false, message: "Invalid characters" });
    }

    const existing = await prisma.user.findUnique({ where: { username } });

    return reply.send({ 
      available: !existing,
      message: existing ? "Username taken" : "Available"
    });
  });
}
