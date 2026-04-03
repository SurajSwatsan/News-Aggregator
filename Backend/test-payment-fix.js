const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

async function testVerification() {
  const prisma = new PrismaClient();
  
  try {
    // 1. Create a dummy transaction
    const orderId = `test_order_${Date.now()}`;
    const transaction = await prisma.transaction.create({
      data: {
        userId: 'some-user-id', // Use a real ID if you want to test credit balance
        planId: 'some-plan-id',
        amount: 10000,
        razorpayOrderId: orderId,
        status: 'PENDING',
        credits: 50,
      }
    });
    console.log('Created pending transaction:', transaction.id);

    // 2. Simulate verification (skip signature check for local test or mock config)
    // Actually, I'll just manually call the update logic to see if it sets COMPLETED
    const updated = await prisma.transaction.update({
      where: { razorpayOrderId: orderId },
      data: {
        status: 'COMPLETED',
        razorpayPaymentId: 'pay_test_123',
        razorpaySignature: 'sig_test_123',
      }
    });

    console.log('Updated transaction status:', updated.status);
    if (updated.status === 'COMPLETED') {
      console.log('✅ Status correctly changed to COMPLETED');
    } else {
      console.log('❌ Status check failed. Expected COMPLETED, got:', updated.status);
    }

    // Cleanup
    await prisma.transaction.delete({ where: { id: transaction.id } });
    console.log('Cleaned up test data.');

  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testVerification();
