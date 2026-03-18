import { PrismaClient } from '@prisma/client';

async function checkCategories() {
  const prisma = new PrismaClient();
  try {
    const categories = await prisma.article.groupBy({
      by: ['category'],
      _count: {
        _all: true,
      },
    });
    console.log('Categories found:', JSON.stringify(categories, null, 2));
  } catch (error) {
    console.error('Error checking categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCategories();
