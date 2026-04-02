import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up watermarked advertisements...');
  
  // Specifically remove only the watermarked ones I seeded before
  // or any that have 'w3schools' / 'w3.org' which often have watermarks or are unreliable
  const result = await prisma.advertisement.deleteMany({
    where: {
      OR: [
        { mediaUrl: { contains: 'w3.org' } },
        { mediaUrl: { contains: 'w3schools.com' } },
        { title: { contains: 'Breaking News' } }, // My old seed title
        { title: { contains: 'Tech Insights' } }  // My old seed title
      ],
      createdBy: 'ADMIN' // Only delete system ones, NEVER user ones
    }
  });

  console.log(`✅ Removed ${result.count} watermarked/old system advertisements.`);
  console.log('User campaigns were preserved.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
