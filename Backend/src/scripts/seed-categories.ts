import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const articles = await prisma.article.findMany();
  console.log(`Processing ${articles.length} articles...`);

  for (const article of articles) {
    let category = 'World'; // Default
    const title = article.title.toLowerCase();
    
    if (title.includes('sport') || title.includes('football') || title.includes('cricket') || title.includes('olympic')) {
      category = 'Sports';
    } else if (title.includes('tech') || title.includes('google') || title.includes('apple') || title.includes('ai') || title.includes('software')) {
      category = 'Technology';
    } else if (title.includes('market') || title.includes('stock') || title.includes('economy') || title.includes('business')) {
      category = 'Business';
    } else if (title.includes('health') || title.includes('virus') || title.includes('doctor') || title.includes('medical')) {
      category = 'Health';
    } else if (title.includes('politic') || title.includes('vote') || title.includes('election') || title.includes('government')) {
      category = 'Politics';
    }

    await prisma.article.update({
      where: { id: article.id },
      data: { category }
    });
  }

  console.log('Categories updated successfully!');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
