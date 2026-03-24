const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDuplicates() {
  const articles = await prisma.article.findMany({
    select: {
      id: true,
      title: true,
      sourceUrl: true,
      sourceId: true,
      postedAt: true
    }
  });

  console.log(`Total articles: ${articles.length}`);

  const seenTitles = new Map();
  const duplicates = [];

  for (const article of articles) {
    const title = article.title.trim().toLowerCase();
    if (seenTitles.has(title)) {
      duplicates.push({
        title: article.title,
        original: seenTitles.get(title),
        duplicate: article
      });
    } else {
      seenTitles.set(title, article);
    }
  }

  console.log(`Found ${duplicates.length} title-based duplicates.`);
  if (duplicates.length > 0) {
    console.log('Sample duplicate:', JSON.stringify(duplicates[0], null, 2));
  }
  
  // Also check for very similar titles
  console.log('\nChecking for very similar titles (90%+ word overlap)...');
  const similar = [];
  for (let i = 0; i < articles.length; i++) {
    for (let j = i + 1; j < articles.length; j++) {
      const title1 = articles[i].title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const title2 = articles[j].title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      
      const overlap = title1.filter(w => title2.includes(w)).length;
      const ratio = overlap / Math.max(title1.length, title2.length);
      
      if (ratio > 0.7 && ratio < 1.0) {
        similar.push({
          ratio,
          a: articles[i].title,
          b: articles[j].title
        });
      }
    }
  }
  
  console.log(`Found ${similar.length} very similar articles.`);
  if (similar.length > 0) {
    console.log('Sample similar:', JSON.stringify(similar.slice(0, 3), null, 2));
  }

  await prisma.$disconnect();
}

checkDuplicates();
