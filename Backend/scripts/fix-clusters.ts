import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Automated Cluster De-Munger ---');

  const clusters = await prisma.article.groupBy({
    by: ['clusterId'],
    _count: { id: true },
    where: { clusterId: { not: null } },
    having: { id: { _count: { gt: 1 } } }
  });

  console.log(`Scanning ${clusters.length} multi-article clusters...`);
  let fixCount = 0;

  for (const cluster of clusters) {
    const clusterArticles = await prisma.article.findMany({
      where: { clusterId: cluster.clusterId },
      orderBy: { postedAt: 'asc' } // Oldest first (assumed root)
    });

    if (clusterArticles.length <= 1) continue;

    const baseArticle = clusterArticles[0];
    const baseKeywords = getKeywords(baseArticle.title);

    for (let i = 1; i < clusterArticles.length; i++) {
      const otherArticle = clusterArticles[i];
      const otherKeywords = getKeywords(otherArticle.title);
      
      const overlap = baseKeywords.filter(w => otherKeywords.includes(w)).length;
      const ratio = overlap / Math.max(baseKeywords.length, otherKeywords.length, 1);

      // If zero overlap, definitely different. Re-assign to a new cluster.
      if (ratio === 0) {
        console.log(`  [Fixing] Moving "${otherArticle.title}" out of Cluster ${cluster.clusterId} (0% overlap with "${baseArticle.title}")`);
        
        // Find current max clusterId
        const maxCluster = await prisma.article.aggregate({ _max: { clusterId: true } });
        const newId = (maxCluster._max.clusterId || 0) + 1;

        await prisma.article.update({
          where: { id: otherArticle.id },
          data: { clusterId: newId }
        });
        fixCount++;
      }
    }
  }

  console.log(`\nAutomation complete. Fixed ${fixCount} articles.`);
}

function getKeywords(text: string): string[] {
  const stopWords = new Set(['the', 'this', 'that', 'with', 'from', 'brought', 'shares', 'warns', 'shows', 'tells', 'will', 'your', 'says', 'about']);
  return text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
