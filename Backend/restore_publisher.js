const { PrismaClient } = require('@prisma/client');

async function restoreMissingRecord() {
  const url = `postgresql://postgres:123@localhost:5433/newsaggregator?schema=public`;
  const prisma = new PrismaClient({
    datasources: { db: { url: url } }
  });

  const id = 'b982c7b6-b4e5-4bd7-9b57-16d5604d2f23';
  const email = 'ts.Patil@swatsan.com';
  const orgName = '4news';

  console.log(`--- RESTORING MISSING RECORD: ${id} ---`);

  try {
    const existing = await prisma.publisherOnboarding.findUnique({
      where: { id: id }
    });

    if (existing) {
      console.log('Record already exists in the database. Status:', existing.status);
      return;
    }

    const record = await prisma.publisherOnboarding.create({
      data: {
        id: id,
        token: 'restored-token-' + Date.now(), // Unique token for approval flow
        email: email,
        orgName: orgName,
        status: 'registered',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
        requestedRole: 'publisher'
      }
    });

    console.log('Successfully restored record:', JSON.stringify(record, null, 2));
    console.log('\nNow you can refresh the dashboard and click "Approve" again.');
  } catch (err) {
    console.error('Error during restoration:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

restoreMissingRecord();
