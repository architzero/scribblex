import { PrismaClient, RoomType, RoomPersistence, RoomVisibility } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCommunityRooms() {
  // Create system user first if doesn't exist
  const systemUser = await prisma.user.upsert({
    where: { email: 'system@scribblex.app' },
    update: {},
    create: {
      email: 'system@scribblex.app',
      username: 'system',
      name: 'ScribbleX',
      isVerified: true,
      profileCompleted: true,
    },
  });

  const communityRooms = [
    {
      id: 'plaza',
      title: '🌍 The Plaza',
      description: 'Main hangout spot. Draw, chat, vibe.',
      roomType: RoomType.COMMUNITY,
      persistence: RoomPersistence.PERSISTENT,
      visibility: RoomVisibility.PUBLIC,
      tags: ['general', 'hangout', 'social'],
      isActive: true,
      createdBy: systemUser.id,
    },
    {
      id: 'studio',
      title: '🎨 Creative Studio',
      description: 'For artists, designers, and creators.',
      roomType: RoomType.COMMUNITY,
      persistence: RoomPersistence.PERSISTENT,
      visibility: RoomVisibility.PUBLIC,
      tags: ['art', 'design', 'creative'],
      isActive: true,
      createdBy: systemUser.id,
    },
    {
      id: 'gamenight',
      title: '🎮 Game Night',
      description: 'Sketch games, challenges, and fun.',
      roomType: RoomType.COMMUNITY,
      persistence: RoomPersistence.PERSISTENT,
      visibility: RoomVisibility.PUBLIC,
      tags: ['games', 'fun', 'competitive'],
      isActive: true,
      createdBy: systemUser.id,
    },
  ];

  for (const room of communityRooms) {
    await prisma.room.upsert({
      where: { id: room.id },
      update: {},
      create: room,
    });
  }

  console.log('✅ Community rooms seeded');
}

seedCommunityRooms()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
