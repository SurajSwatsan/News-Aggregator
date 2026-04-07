import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Synchronizing premium, watermark-free system advertisements...');

  const ads = [
    // Header Ads (Priority -100 - High-quality, Watermark-free)
    {
      title: 'Global Connectivity Initiative',
      adType: 'video',
      mediaUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
      targetUrl: 'https://example.com/connectivity',
      placementType: 'header',
      createdBy: 'ADMIN',
      status: 'active',
      isActive: true,
      position: -100,
    },
    {
      title: 'Cinematic Travel Journals',
      adType: 'video',
      mediaUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      targetUrl: 'https://example.com/travel',
      placementType: 'header',
      createdBy: 'ADMIN',
      status: 'active',
      isActive: true,
      position: -100,
    },
    // In-Feed Ads (Priority -100)
    {
      title: 'Modern Architecture Trends',
      adType: 'image',
      mediaUrl: 'https://picsum.photos/seed/archW1/1200/800',
      targetUrl: 'https://example.com/architecture',
      placementType: 'in-feed',
      createdBy: 'ADMIN',
      status: 'active',
      isActive: true,
      position: -100,
    },
    {
      title: 'Sustainable Energy Solutions',
      adType: 'image',
      mediaUrl: 'https://picsum.photos/seed/energyW2/1200/800',
      targetUrl: 'https://example.com/energy',
      placementType: 'in-feed',
      createdBy: 'ADMIN',
      status: 'active',
      isActive: true,
      position: -100,
    },
    // Sidebar Ads (Priority -100)
    {
      title: 'Luxury Real Estate Expos',
      adType: 'image',
      mediaUrl: 'https://picsum.photos/seed/realS1/400/600',
      targetUrl: 'https://example.com/realestate',
      placementType: 'sidebar',
      createdBy: 'ADMIN',
      status: 'active',
      isActive: true,
      position: -100,
    },
    {
      title: 'Global Travel Destinations',
      adType: 'image',
      mediaUrl: 'https://picsum.photos/seed/travelS2/400/600',
      targetUrl: 'https://example.com/travel',
      placementType: 'sidebar',
      createdBy: 'ADMIN',
      status: 'active',
      isActive: true,
      position: -100,
    },
  ];

  for (const ad of ads) {
    const adId = `seed-ad-${ad.title.toLowerCase().replace(/\s+/g, '-')}`;
    await prisma.advertisement.upsert({
      where: { id: adId },
      update: {
        ...ad,
        updatedAt: new Date(),
      },
      create: {
        id: adId,
        ...ad,
      },
    });
  }

  console.log('✅ Premium advertisement synchronization completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
