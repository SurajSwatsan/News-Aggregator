import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
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
    private auditLogs: AuditLogsService,
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
    
    const inviteLink = `http://localhost:4200/onboarding?token=${onboarding.token}`;
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
    publisherFirstName?: string,
    publisherLastName?: string,
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
        firstName: data.publisherFirstName || (data.publisherName ? data.publisherName.split(' ')[0] : undefined),
        lastName: data.publisherLastName || (data.publisherName ? data.publisherName.split(' ').slice(1).join(' ') : undefined),
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

  async approvePublisher(idOrToken: string) {
    console.log('[OnboardingService] Attempting to approve:', idOrToken);
    
    const onboarding = await this.prisma.publisherOnboarding.findFirst({
      where: {
        OR: [
          { id: idOrToken },
          { token: idOrToken }
        ]
      }
    });

    if (!onboarding) {
      console.warn('[OnboardingService] Request not found for ID/Token:', idOrToken);
      throw new NotFoundException(`Registration request not found. The record may have been deleted or the ID is incorrect.`);
    }

    console.log('[OnboardingService] Found record with status:', onboarding.status);

    // If already approved, treat as idempotent — just resend the approval email
    if (onboarding.status === OnboardingStatus.approved) {
      const approvalLink = `http://localhost:4200/confirm-approval?token=${onboarding.token}`;
      await this.mailService.sendApprovalLink(onboarding.email, onboarding.orgName || 'Organization', approvalLink);
      return { message: 'Already approved. Approval email resent to publisher.', activationLink: approvalLink };
    }

    if (onboarding.status !== OnboardingStatus.registered) {
      console.warn('[OnboardingService] Cannot approve — current status is:', onboarding.status);
      throw new BadRequestException(`Cannot approve: this request has status '${onboarding.status}'. Only 'registered' requests can be approved.`);
    }

    await this.prisma.publisherOnboarding.update({
      where: { id: onboarding.id },
      data: { status: OnboardingStatus.approved }
    });

    await this.auditLogs.createLog({
      action: 'PUBLISHER_APPROVED',
      resourceType: 'ONBOARDING',
      resourceId: onboarding.id,
      metadata: { email: onboarding.email, orgName: onboarding.orgName }
    });

    const approvalLink = `http://localhost:4200/confirm-approval?token=${onboarding.token}`;
    // Send approval notification (Mail 1)
    const mailResult = await this.mailService.sendApprovalLink(onboarding.email, onboarding.orgName || 'Organization', approvalLink);

    let message = 'Approved! Approval confirmation email sent to the publisher.';
    if (!mailResult) {
      message = 'Approved! However, the automated email failed to send. Please share the confirmation link manually.';
    }

    return { message, activationLink: approvalLink };
  }

  async confirmPublisherApproval(token: string) {
    // Trim any stray quotes that might have been included from terminal copy-paste
    token = token.replace(/["']/g, '');

    const onboarding = await this.prisma.publisherOnboarding.findUnique({
      where: { token }
    });

    if (!onboarding) {
      throw new BadRequestException('Invalid or expired approval token');
    }

    // ✅ Check if a user with this email is already registered (already logged in / account exists)
    const existingUser = await this.prisma.user.findUnique({
      where: { email: onboarding.email }
    });

    if (existingUser && !(existingUser as any).isDeleted) {
      throw new BadRequestException('This email is already registered. Please log in to your existing account.');
    }

    // If already confirmed or completed, treat as success (idempotent re-click)
    if (onboarding.status === OnboardingStatus.confirmed || onboarding.status === OnboardingStatus.completed) {
      return { message: 'Already confirmed. Check your email for the password setup link.' };
    }

    if (onboarding.status !== OnboardingStatus.approved) {
      throw new BadRequestException('Invalid or expired approval token');
    }

    await this.prisma.publisherOnboarding.update({
      where: { token },
      data: { status: OnboardingStatus.confirmed }
    });

    const setPasswordLink = `http://localhost:4200/activate-account?token=${onboarding.token}`;
    // Send password set email (Mail 2)
    await this.mailService.sendActivation(onboarding.email, onboarding.orgName || 'Organization', setPasswordLink);

    return { message: 'Approval confirmed! A password-set link has been sent to your email.' };
  }
  
  async rejectPublisher(idOrToken: string) {
    const onboarding = await this.prisma.publisherOnboarding.findFirst({
      where: {
        OR: [
          { id: idOrToken },
          { token: idOrToken }
        ],
        status: OnboardingStatus.registered
      }
    });

    if (!onboarding) throw new NotFoundException('Registration request not found or not in registered status');

    await this.prisma.publisherOnboarding.update({
      where: { id: onboarding.id },
      data: { status: OnboardingStatus.rejected }
    });

    await this.auditLogs.createLog({
      action: 'PUBLISHER_REJECTED',
      resourceType: 'ONBOARDING',
      resourceId: onboarding.id,
      metadata: { email: onboarding.email }
    });

    return { message: 'Registration request rejected.' };
  }

  async setPassword(token: string, passwordHash: string) {
    const onboarding = await this.prisma.publisherOnboarding.findUnique({
      where: { token }
    });

    if (!onboarding) {
      throw new BadRequestException('Invalid activation link. Please check your email for the correct link.');
    }

    console.log('[OnboardingService] setPassword — current status:', onboarding.status);

    // If already completed — account was already activated, just log in
    if (onboarding.status === OnboardingStatus.completed) {
      throw new BadRequestException('Your account is already activated. Please log in.');
    }

    // Accept both 'confirmed' and 'approved' — resilient to edge cases in the status flow
    const allowedStatuses: OnboardingStatus[] = [OnboardingStatus.confirmed, OnboardingStatus.approved];
    const canActivate = allowedStatuses.includes(onboarding.status);
    if (!canActivate) {
      throw new BadRequestException(`Cannot activate: account status is '${onboarding.status}'. Contact support if you believe this is an error.`);
    }

    return await this.completeActivation(onboarding, passwordHash);
  }

  async activateApprovedAccount(token: string) {
    const onboarding = await this.prisma.publisherOnboarding.findUnique({
      where: { token }
    });

    if (!onboarding || onboarding.status !== OnboardingStatus.approved) {
      throw new BadRequestException('Invalid or expired activation token');
    }

    if (!onboarding.passwordHash) {
      throw new BadRequestException('Account requires a password to be set.');
    }

    return await this.completeActivation(onboarding, onboarding.passwordHash);
  }

  private async completeActivation(onboarding: any, passwordHash: string) {
    // Always verify username uniqueness — even if one was set during registration,
    // it may already be taken by a duplicate/test onboarding record.
    let username = onboarding.username || '';
    const existingWithUsername = username
      ? await this.prisma.user.findUnique({ where: { username } })
      : null;

    if (!username || existingWithUsername) {
      // Generate a guaranteed-unique username from orgName or email prefix
      const base = (onboarding.orgName || onboarding.email.split('@')[0])
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')  // strip special chars
        .slice(0, 16);               // max 16 chars from base
      let isUnique = false;
      while (!isUnique) {
        const suffix = Math.floor(1000 + Math.random() * 9000); // 4-digit random suffix
        username = `${base}${suffix}`;
        const taken = await this.prisma.user.findUnique({ where: { username } });
        if (!taken) isUnique = true;
      }
    }

    // Use a transaction to ensure all or nothing
    const result = await this.prisma.$transaction(async (tx) => {
      // Create or Update the User (Restore if soft-deleted)
      const user = await tx.user.upsert({
        where: { email: onboarding.email },
        update: {
          username,
          name: onboarding.requestedRole === 'publisher' && onboarding.orgName 
            ? onboarding.orgName 
            : (onboarding.firstName ? `${onboarding.firstName} ${onboarding.lastName || ''}`.trim() : (onboarding.orgName || null)),
          firstName: onboarding.firstName,
          lastName: onboarding.lastName,
          orgName: onboarding.orgName,
          orgWebsite: onboarding.orgWebsite,
          orgDescription: onboarding.orgDescription,
          phone: onboarding.phone,
          city: onboarding.city,
          country: onboarding.country,
          businessDoc: onboarding.businessDoc,
          newspaperLicense: onboarding.newspaperLicense,
          rssUrl: onboarding.rssUrl,
          passwordHash,
          role: onboarding.requestedRole,
          creditBalance: onboarding.requestedRole === UserRole.admin ? 1000 : (onboarding.requestedRole === UserRole.publisher ? 0 : 10),
          isDeleted: false,
          deletedAt: null
        },
        create: {
          email: onboarding.email,
          username,
          firstName: onboarding.firstName,
          lastName: onboarding.lastName,
          name: onboarding.requestedRole === 'publisher' && onboarding.orgName 
            ? onboarding.orgName 
            : (onboarding.firstName ? `${onboarding.firstName} ${onboarding.lastName || ''}`.trim() : (onboarding.orgName || null)),
          orgName: onboarding.orgName,
          orgWebsite: onboarding.orgWebsite,
          orgDescription: onboarding.orgDescription,
          phone: onboarding.phone,
          city: onboarding.city,
          country: onboarding.country,
          businessDoc: onboarding.businessDoc,
          newspaperLicense: onboarding.newspaperLicense,
          rssUrl: onboarding.rssUrl,
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
          description: onboarding.orgDescription,
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

      await this.auditLogs.createLog({
        userId: user.id,
        action: 'ACCOUNT_ACTIVATED',
        resourceType: 'USER',
        resourceId: user.id,
        metadata: { role: user.role, email: user.email }
      });

      return { user, source };
    });

    // Initial Sync outside transaction
    if (result.source.rssUrl) {
      this.rssEngine.syncRSSNews(result.source.id).catch(err => {
        console.error('Initial sync failed:', err);
      });
    }

    return { message: 'Account activated successfully.' };
  }
}
