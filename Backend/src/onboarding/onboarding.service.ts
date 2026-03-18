import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OnboardingStatus, UserRole } from '@prisma/client';
import { MailService } from '../mail/mail.service';
import * as crypto from 'crypto';
import { RSSEngineService } from '../rss-engine/rss-engine.service';

@Injectable()
export class OnboardingService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private rssEngine: RSSEngineService,
  ) {}

  async invitePublisher(email: string) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    const onboarding = await this.prisma.publisherOnboarding.create({
      data: {
        token: crypto.randomUUID(),
        email,
        expiresAt,
      },
    });
    
    const inviteLink = `http://localhost:4200/register-publisher?token=${onboarding.token}`;
    await this.mailService.sendInvitation(email, inviteLink);

    return { inviteLink, token: onboarding.token };
  }

  async verifyToken(token: string) {
    const onboarding = await this.prisma.publisherOnboarding.findFirst({
      where: { 
        token, 
        status: OnboardingStatus.pending,
        expiresAt: { gt: new Date() }
      },
    });

    if (!onboarding) {
      throw new BadRequestException('Invalid or expired invitation token');
    }

    return onboarding;
  }

  async registerPublisher(token: string, data: { 
    orgName: string, 
    orgWebsite: string, 
    rssUrl?: string,
    orgDescription: string,
    publisherName?: string,
    country?: string,
    city?: string,
    phone?: string,
    businessDoc?: string,
    newspaperLicense?: string
  }) {
    const onboarding = await this.verifyToken(token);

    let finalRssUrl: string | null = data.rssUrl || null;
    if (!finalRssUrl && data.orgWebsite) {
      finalRssUrl = await this.rssEngine.discoverRssUrl(data.orgWebsite);
    }

    return await this.prisma.publisherOnboarding.update({
      where: { id: onboarding.id },
      data: {
        orgName: data.orgName,
        orgWebsite: data.orgWebsite,
        rssUrl: finalRssUrl,
        orgDescription: data.orgDescription,
        publisherName: data.publisherName,
        country: data.country,
        city: data.city,
        phone: data.phone,
        businessDoc: data.businessDoc,
        newspaperLicense: data.newspaperLicense,
        status: OnboardingStatus.registered,
      },
    });
  }

  async getPendingRequests() {
    return await this.prisma.publisherOnboarding.findMany({
      where: { status: OnboardingStatus.registered },
      orderBy: { createdAt: 'desc' }
    });
  }

  async approvePublisher(id: string) {
    const onboarding = await this.prisma.publisherOnboarding.findFirst({ 
      where: { id, status: OnboardingStatus.registered } 
    });
    
    if (!onboarding) throw new NotFoundException('Registration request not found');

    await this.prisma.publisherOnboarding.update({
      where: { id },
      data: { status: OnboardingStatus.approved }
    });

    const activationLink = `http://localhost:4200/activate-account?token=${onboarding.token}`;
    // Send activation email
    const mailResult = await this.mailService.sendActivation(onboarding.email, onboarding.orgName || 'Organization', activationLink);

    let message = 'Approved! Activation email sent to the publisher.';
    if (!mailResult) {
      message = 'Approved! However, the automated email failed to send. Please share the activation link manually.';
    }

    return { message, activationLink };
  }
  
  async rejectPublisher(id: string) {
    const onboarding = await this.prisma.publisherOnboarding.findFirst({ 
      where: { id, status: OnboardingStatus.registered } 
    });
    
    if (!onboarding) throw new NotFoundException('Registration request not found');

    await this.prisma.publisherOnboarding.update({
      where: { id },
      data: { status: OnboardingStatus.rejected }
    });

    return { message: 'Registration request rejected.' };
  }

  async setPassword(token: string, passwordHash: string) {
    const onboarding = await this.prisma.publisherOnboarding.findUnique({
      where: { token }
    });

    if (!onboarding || onboarding.status !== OnboardingStatus.approved) {
      throw new BadRequestException('Invalid activation token');
    }

    // Use a transaction to ensure all or nothing
    const result = await this.prisma.$transaction(async (tx) => {
      // Create the User
      const user = await tx.user.create({
        data: {
          email: onboarding.email,
          name: onboarding.publisherName || onboarding.orgName || null,
          orgName: onboarding.orgName,
          orgWebsite: onboarding.orgWebsite,
          phone: onboarding.phone,
          city: onboarding.city,
          country: onboarding.country,
          businessDoc: onboarding.businessDoc,
          newspaperLicense: onboarding.newspaperLicense,
          passwordHash,
          role: onboarding.requestedRole,
          creditBalance: onboarding.requestedRole === UserRole.admin ? 1000 : (onboarding.requestedRole === UserRole.publisher ? 0 : 10),
        },
      });

      // Create the News Source
      const source = await tx.source.create({
        data: {
          name: onboarding.orgName || 'Unknown Organization',
          homepageUrl: onboarding.orgWebsite || '',
          rssUrl: onboarding.rssUrl,
          ownerId: user.id,
          isActive: true,
          scrapingInterval: 60,
        },
      });

      // Mark onboarding as completed
      await tx.publisherOnboarding.update({
        where: { id: onboarding.id },
        data: { status: OnboardingStatus.completed }
      });

      return { user, source };
    });

    // Initial Sync outside transaction
    if (result.source.rssUrl) {
      this.rssEngine.syncRSSNews(result.source.id).catch(err => {
        console.error('Initial sync failed:', err);
      });
    }

    return { message: 'Password set successfully. Account activated.' };
  }
}
