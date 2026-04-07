import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const sources = await prisma.source.findMany({
    include: {
      owner: true,
    },
  });

  console.log('--- ALL SOURCES AND OWNERS ---');
  console.table(
    sources.map((s) => ({
      sourceId: s.id,
      sourceName: s.name,
      ownerId: s.ownerId,
      ownerEmail: s.owner?.email || 'UNOWNED',
    })),
  );

  const users = await prisma.user.findMany();
  console.log('--- ALL USERS ---');
  console.table(
    users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
    })),
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
