import { PrismaClient } from '@prisma/client';

async function checkSource() {
  const prisma = new PrismaClient();
  const sourceId = '424afffc-3d94-4b72-b028-21bfad3fd142';
  
  const source = await prisma.source.findUnique({
    where: { id: sourceId },
    include: { articles: { take: 5 } }
  });
  
  console.log('--- Source Information ---');
  console.log(JSON.stringify(source, null, 2));
  
  const articleCount = await prisma.article.count({
    where: { sourceId }
  });
  console.log('Total articles for this source:', articleCount);
  
  await prisma.$disconnect();
}

checkSource();
