const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function lastLogs() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log(JSON.stringify(logs, null, 2));
}
lastLogs().finally(() => prisma.$disconnect());
