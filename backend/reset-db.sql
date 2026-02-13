-- Reset all users and related data
TRUNCATE TABLE "Activity" CASCADE;
TRUNCATE TABLE "RoomMember" CASCADE;
TRUNCATE TABLE "Room" CASCADE;
TRUNCATE TABLE "Session" CASCADE;
TRUNCATE TABLE "AuditLog" CASCADE;
TRUNCATE TABLE "IPLockout" CASCADE;
TRUNCATE TABLE "User" CASCADE;

-- Reset sequences if needed
-- This ensures IDs start fresh
