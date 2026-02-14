const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetDatabase() {
  try {
    console.log('🗑️  Deleting all data...');
    
    // Delete in correct order (respecting foreign keys)
    await prisma.roomParticipant.deleteMany();
    await prisma.room.deleteMany();
    await prisma.session.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.iPLockout.deleteMany();
    await prisma.user.deleteMany();
    
    console.log('✅ Database reset complete!');
    console.log('📊 All users and related data have been deleted.');
    console.log('🚀 You can now start fresh with new signups.');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase();
