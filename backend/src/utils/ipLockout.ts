import prisma from "../prisma";

export async function checkIPLockout(ipAddress: string): Promise<{ locked: boolean; minutesLeft?: number }> {
  const lockout = await prisma.iPLockout.findUnique({ where: { ipAddress } });

  if (!lockout) return { locked: false };

  if (lockout.lockUntil && lockout.lockUntil > new Date()) {
    const minutesLeft = Math.ceil((lockout.lockUntil.getTime() - Date.now()) / 60000);
    return { locked: true, minutesLeft };
  }

  return { locked: false };
}

export async function recordFailedAttempt(ipAddress: string) {
  const lockout = await prisma.iPLockout.findUnique({ where: { ipAddress } });

  if (!lockout) {
    await prisma.iPLockout.create({
      data: { ipAddress, attempts: 1 },
    });
    return;
  }

  const attempts = lockout.attempts + 1;

  await prisma.iPLockout.update({
    where: { ipAddress },
    data: {
      attempts,
      lockUntil: attempts >= 10 ? new Date(Date.now() + 30 * 60 * 1000) : null,
    },
  });
}

export async function resetIPAttempts(ipAddress: string) {
  await prisma.iPLockout.updateMany({
    where: { ipAddress },
    data: { attempts: 0, lockUntil: null },
  });
}
