import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const targetTitle = "How the Middle East war has brought MP's basmati exports to a standstill";
  
  const article = await prisma.article.findFirst({
    where: { title: { contains: "basmati", mode: 'insensitive' } },
    include: { source: true }
  });

  if (!article) {
    console.log("Could not find the 'basmati' article in the database.");
    return;
  }

  console.log(`Found Article: [${article.source.name}] ID: ${article.id} ClusterID: ${article.clusterId}`);
  console.log(`Title: ${article.title}`);

  if (article.clusterId !== null) {
    const related = await prisma.article.findMany({
      where: { clusterId: article.clusterId },
      include: { source: true }
    });

    console.log(`\nCluster ID: ${article.clusterId} (${related.length} articles total)`);
    for (const r of related) {
      console.log(`  - [${r.source.name}] ID: ${r.id} Title: ${r.title} (${r.postedAt.toISOString()})`);
    }
  } else {
    console.log("\nThis article has NO clusterId (it's null).");
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
