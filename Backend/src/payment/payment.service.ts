import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import * as crypto from 'crypto';
import { NotificationService } from '../notification/notification.service';
import Razorpay = require('razorpay');

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private razorpay: Razorpay;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private mailService: MailService,
    private notificationService: NotificationService,
  ) {
    this.razorpay = new Razorpay({
      key_id: this.config.get<string>('RAZORPAY_KEY_ID'),
      key_secret: this.config.get<string>('RAZORPAY_KEY_SECRET'),
    });
  }

  async createOrder(
    planId: string,
    userId: string,
    amount: number,
    credits: number,
    snapshot?: any,
  ) {
    try {
      this.logger.log(
        `Creating Razorpay order for plan ${planId} (user: ${userId})`,
      );

      const options = {
        amount: Math.round(amount * 100), // Razorpay expects amount in paise
        currency: 'INR',
        receipt: `receipt_${Date.now()}_${userId.slice(0, 5)}`,
      };

      const order = await this.razorpay.orders.create(options);

      // Create a pending transaction in our database
      const transaction = await this.prisma.paymentTransaction.create({
        data: {
          userId,
          planId,
          amount: amount, // Save base amount in DB (e.g. 100)
          razorpayOrderId: order.id,
          status: 'PENDING',
          credits,
          paymentSnapshot: snapshot || null,
        },
      });

      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        transactionId: transaction.id,
        key: this.config.get<string>('RAZORPAY_KEY_ID'),
      };
    } catch (error) {
      this.logger.error('Failed to create Razorpay order', error.stack);
      throw error;
    }
  }

  async verifyPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    userId: string,
  ) {
    try {
      this.logger.log(`Verifying payment for order ${razorpayOrderId}`);

      const text = `${razorpayOrderId}|${razorpayPaymentId}`;
      const secret = this.config.get<string>('RAZORPAY_KEY_SECRET') || '';

      const generated_signature = crypto
        .createHmac('sha256', secret)
        .update(text)
        .digest('hex');

      this.logger.debug(`Generated signature: ${generated_signature}`);
      this.logger.debug(`Received signature: ${razorpaySignature}`);

      if (generated_signature !== razorpaySignature) {
        this.logger.error(
          `Signature verification failed for order ${razorpayOrderId}`,
        );

        await this.prisma.paymentTransaction.update({
          where: { razorpayOrderId },
          data: {
            status: 'FAILED',
            razorpayPaymentId,
            razorpaySignature,
          },
        });

        const user = await this.prisma.user.findUnique({
          where: { id: userId },
        });

        // Send failure email
        if (user) {
          this.mailService
            .sendPaymentFailed(
              user.email,
              'Invalid payment signature',
              razorpayOrderId,
            )
            .catch((err) =>
              this.logger.error('Failed to send failure email', err),
            );
        }

        return { success: false, message: 'Invalid payment signature' };
      }

      // Update the transaction in our database
      this.logger.log(
        `Setting transaction status to COMPLETED for order ${razorpayOrderId}`,
      );
      const transaction = await this.prisma.paymentTransaction.update({
        where: { razorpayOrderId },
        data: {
          status: 'COMPLETED',
          razorpayPaymentId,
          razorpaySignature,
        },
      });

      const user = await this.prisma.user.findUnique({ where: { id: userId } });

      // Send success email
      if (user) {
        this.mailService
          .sendPaymentSuccess(
            user.email,
            (transaction.paymentSnapshot as any)?.['planName'] ||
              'Premium Plan',
            Number(transaction.amount),
            transaction.id,
          )
          .catch((err) =>
            this.logger.error('Failed to send success email', err),
          );
      }

      // Get the plan data to add credits
      const plan = await this.prisma.subscriptionPlan.findUnique({
        where: { id: transaction.planId },
      });

      if (!plan) {
        this.logger.error(
          `Plan ${transaction.planId} not found during credit update`,
        );
        return { success: false, message: 'Plan not found' };
      }

      // Add credits to user balance
      // Wait, we need to handle the subscriptions JSON too if it's a tiered plan
      // For now, let's look at the basic credits field in SubscriptionPlan or the relevant tiered credit
      // This part depends on which sub-plan they bought (monthly/yearly)
      // I'll need to pass that info or store it in the transaction

      this.logger.log(
        `Payment successful for user ${userId}. Logic to add credits goes here.`,
      );

      // Update user credit balance using the credits stored in the transaction
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          creditBalance: {
            increment: transaction.credits,
          },
        },
      });

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + plan.validityDays);

      // Trigger In-App Notification
      this.notificationService.createNotification({
        userId,
        title: 'Subscription Activated',
        message: `Your ${plan.name} plan is now active. ${transaction.credits} credits have been added to your account.`,
        type: 'PAYMENT_SUCCESS'
      }).catch(err => this.logger.error('Failed to create in-app notification', err));

      // 2. Notify All Admins
      this.prisma.user.findMany({
        where: { role: 'admin' }
      }).then(admins => {
        const adminPromises = admins.map(admin => 
          this.notificationService.createNotification({
            userId: admin.id,
            title: 'New Subscription Sale',
            message: `User ${user?.name || user?.email} purchased the ${plan.name} plan for ₹${Number(transaction.amount)}.`,
            type: 'SALE_NOTIFICATION'
          })
        );
        return Promise.all(adminPromises);
      }).catch(err => this.logger.error('Failed to notify admins of new sale', err));

      return { 
        success: true, 

        transactionId: transaction.id,
        planName: plan.name,
        amount: Number(transaction.amount), // Amount is already base currency
        credits: transaction.credits,
        validityDays: plan.validityDays,
        expiryDate: expiryDate.toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to verify Razorpay payment', error.stack);
      throw error;
    }
  }

  async getLatestTransaction(userId: string) {
    const transaction = await this.prisma.paymentTransaction.findFirst({
      where: {
        userId,
        status: 'COMPLETED',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!transaction) return null;

    // Get the plan info as well
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: transaction.planId },
    });

    return {
      transaction,
      plan,
    };
  }
}
