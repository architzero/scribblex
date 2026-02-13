import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate';
import { prisma } from '../server';
import { z } from 'zod';

const completeProfileSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(3).regex(/^[a-z0-9_]+$/),
  avatar: z.string().optional(),
  bio: z.string().max(160).optional(),
  location: z.string().optional(),
  dateOfBirth: z.string().optional(),
  socialLinks: z.array(z.object({
    platform: z.string(),
    url: z.string()
  })).optional()
});

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  bio: z.string().max(160).optional(),
  location: z.string().optional(),
  dateOfBirth: z.string().optional(),
  avatar: z.string().optional(),
  socialLinks: z.array(z.object({
    platform: z.string(),
    url: z.string()
  })).optional()
});

export async function userRoutes(fastify: FastifyInstance) {
  // Check username availability
  fastify.get('/check-username/:username', async (request, reply) => {
    const { username } = request.params as { username: string };
    
    const existingUser = await prisma.user.findFirst({
      where: { username }
    });

    reply.send({ available: !existingUser });
  });

  // Complete profile (first time)
  fastify.post('/complete-profile', { preHandler: authenticate }, async (request, reply) => {
    const body = completeProfileSchema.parse(request.body);
    const userId = request.user!.userId;

    // Check if username is taken
    const existingUser = await prisma.user.findFirst({
      where: {
        username: body.username,
        NOT: { id: userId }
      }
    });

    if (existingUser) {
      return reply.code(400).send({ success: false, message: 'Username already taken' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: body.name,
        username: body.username,
        avatarUrl: body.avatar,
        bio: body.bio,
        location: body.location,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        socialLinks: body.socialLinks || [],
        profileCompleted: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        avatarUrl: true,
        bio: true,
        location: true,
        dateOfBirth: true,
        socialLinks: true,
        profileCompleted: true,
        isVerified: true
      }
    });

    reply.send({ success: true, user });
  });

  // Update profile
  fastify.put('/profile', { preHandler: authenticate }, async (request, reply) => {
    const body = updateProfileSchema.parse(request.body);
    const userId = request.user!.userId;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: body.name,
        bio: body.bio,
        location: body.location,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
        avatarUrl: body.avatar,
        socialLinks: body.socialLinks
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        avatarUrl: true,
        bio: true,
        location: true,
        dateOfBirth: true,
        socialLinks: true,
        profileCompleted: true,
        isVerified: true
      }
    });

    reply.send({ success: true, user });
  });

  // Get current user profile
  fastify.get('/profile', { preHandler: authenticate }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user!.userId },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        avatarUrl: true,
        bio: true,
        location: true,
        dateOfBirth: true,
        socialLinks: true,
        profileCompleted: true,
        isVerified: true,
        createdAt: true
      }
    });

    reply.send({ success: true, user });
  });

  // Delete account
  fastify.delete('/account', { preHandler: authenticate }, async (request, reply) => {
    const userId = request.user!.userId;

    await prisma.user.delete({
      where: { id: userId }
    });

    reply.send({ success: true, message: 'Account deleted successfully' });
  });
}
