import { Controller, Post, Get, Body, Param, Query, BadRequestException, UseGuards } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import * as bcrypt from 'bcrypt';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('invite')
  async invite(@Body('email') email: string) {
    if (!email) throw new BadRequestException('Email is required');
    return this.onboardingService.invitePublisher(email);
  }

  @Get('verify')
  async verify(@Query('token') token: string) {
    return this.onboardingService.verifyToken(token);
  }

  @Post('register')
  async register(@Body() body: { token: string; orgName: string; orgWebsite: string; orgDescription: string }) {
    return this.onboardingService.registerPublisher(body.token, body);
  }

  @Get('requests')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getRequests() {
    return this.onboardingService.getPendingRequests();
  }

  @Post('approve/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async approve(@Param('id') id: string) {
    return this.onboardingService.approvePublisher(id);
  }

  @Post('reject/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async reject(@Param('id') id: string) {
    return this.onboardingService.rejectPublisher(id);
  }

  @Post('activate')
  async activate(@Body() body: { token: string; password: string }) {
    const hashedPassword = await bcrypt.hash(body.password, 10);
    return this.onboardingService.setPassword(body.token, hashedPassword);
  }

  @Get('confirm-approval')
  async confirmApproval(@Query('token') token: string) {
    if (!token) throw new BadRequestException('Token is required');
    return this.onboardingService.confirmPublisherApproval(token);
  }
}
