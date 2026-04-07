import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const sources = await prisma.source.findMany();
  console.log('--- Current News Sources ---');
  console.table(
    sources.map((s) => ({
      id: s.id,
      name: s.name,
      rssUrl: s.rssUrl,
      isActive: s.isActive,
    })),
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
