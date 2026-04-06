const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const articles = await prisma.article.findMany({
      where: { category: 'Environment' },
      select: { clusterId: true }
    });
    
    const uniqueClusters = new Set();
    let nullClusters = 0;
    
    articles.forEach(a => {
      if (a.clusterId === null) nullClusters++;
      else uniqueClusters.add(a.clusterId);
    });
    
    console.log(`Total unique stories (clusters + null): ${uniqueClusters.size + nullClusters}`);
    console.log(`Unique Clusters: ${uniqueClusters.size}`);
    console.log(`Unclustered articles: ${nullClusters}`);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
