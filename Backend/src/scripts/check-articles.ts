import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const articles = await prisma.article.findMany({
    where: {
      OR: [
        { title: { contains: 'Bihar', mode: 'insensitive' } },
        { title: { contains: 'paper leak', mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      title: true,
      category: true,
      clusterId: true,
      sourceId: true,
      postedAt: true
    }
  });
  console.log(JSON.stringify(articles, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
