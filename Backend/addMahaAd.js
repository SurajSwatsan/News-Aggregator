const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function run() {
  await p.advertisement.create({
    data: {
      title: 'Maha Govt Ad',
      mediaUrl: 'http://localhost:3000/uploads/maha-ad.png',
      adType: 'image',
      targetUrl: 'https://sjsa.maharashtra.gov.in/en/?gad_source=5&gad_campaignid=23697570144&gclid=CjwKCAjwvqjOBhAGEiwAngeQnZ1T15SI6d_hvOLKGcnkVay0i9F6pTVsHTd6VaAvBEjfth37cexYhBoCSoUQAvD_BwE',
      placementType: 'in-feed',
      position: 0,
      createdBy: 'system',
      status: 'active',
      isActive: true,
      impressions: 0,
      clicks: 0
    }
  });
  console.log('Maha Ad inserted successfully!');
}

run().catch(console.error).finally(() => p.$disconnect());
