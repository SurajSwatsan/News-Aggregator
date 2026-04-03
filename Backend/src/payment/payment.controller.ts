import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-order')
  @UseGuards(JwtAuthGuard)
  async createOrder(
    @Body('planId') planId: string,
    @Body('amount') amount: number, // in Paise
    @Body('credits') credits: number,
    @Body('snapshot') snapshot: any,
    @Req() req: any,
  ) {
    const userId = req.user.id; // Or however you access it in your AuthGuard
    return await this.paymentService.createOrder(planId, userId, amount, credits, snapshot);
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  async verifyPayment(
    @Body('razorpay_order_id') orderId: string,
    @Body('razorpay_payment_id') paymentId: string,
    @Body('razorpay_signature') signature: string,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return await this.paymentService.verifyPayment(orderId, paymentId, signature, userId);
  }

  @Get('my-transaction')
  @UseGuards(JwtAuthGuard)
  async getMyTransaction(@Req() req: any) {
    const userId = req.user.id;
    return await this.paymentService.getLatestTransaction(userId);
  }
}
