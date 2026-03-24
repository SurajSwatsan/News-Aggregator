import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, OnboardingStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private mailService: MailService,
    private auditLogs: AuditLogsService,
  ) { }

  async requestOtp(email: string, name?: string, username?: string, password?: string) {
    const data = { email, name, username, password };
    // 1. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 2. Try to find user or pending onboarding
    const user = await this.prisma.user.findUnique({ where: { email } });
    
    if (user) {
      await (this.prisma.user as any).update({
        where: { id: user.id },
        data: { 
          otp, 
          otpExpiresAt: expiresAt,
          passwordHash: data.password ? await bcrypt.hash(data.password, 10) : user.passwordHash
        }
      });
    } else {
      // Check if there's a pending onboarding, or create a temporary one for registration
      const onboarding = await this.prisma.publisherOnboarding.findFirst({
        where: { email, status: { not: OnboardingStatus.completed } }
      });

      if (onboarding) {
        await this.prisma.publisherOnboarding.update({
          where: { id: onboarding.id },
          data: { 
            otp, 
            otpExpiresAt: expiresAt,
            firstName: name || onboarding.firstName,
            lastName: username || onboarding.lastName,
            passwordHash: data.password ? await bcrypt.hash(data.password, 10) : onboarding.passwordHash
          }
        });
      } else {
      // Create a basic onboarding record for this new email
      const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : null;
      await this.prisma.publisherOnboarding.create({
        data: {
          token: crypto.randomUUID(),
          email,
          otp,
          otpExpiresAt: expiresAt,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
          status: OnboardingStatus.pending,
          requestedRole: UserRole.reader,
          firstName: name,
          lastName: username,
          passwordHash: hashedPassword
        }
      });
      }
    }

    // 3. Send via email
    await this.mailService.sendOtp(email, otp);
    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(email: string, code: string) {
    // 1. Check User table
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && (user as any).otp === code) {
      const now = new Date();
      if ((user as any).otpExpiresAt && (user as any).otpExpiresAt > now) {
        // Auto-restore if user was deleted
        const updateData: any = { otp: null, otpExpiresAt: null };
        if ((user as any).isDeleted) {
          updateData.isDeleted = false;
          updateData.deletedAt = null;
        }

        const updatedUser = await (this.prisma.user as any).update({
          where: { id: user.id },
          data: updateData
        });

        await this.auditLogs.createLog({
          userId: updatedUser.id,
          action: 'LOGIN_RESTORED',
          resourceType: 'USER',
          resourceId: updatedUser.id,
          metadata: { email: updatedUser.email, reason: 'OTP verification after soft delete' }
        });

        await this.auditLogs.createLog({
          userId: updatedUser.id,
          action: 'LOGIN_SUCCESS',
          resourceType: 'USER',
          resourceId: updatedUser.id,
          metadata: { email: updatedUser.email, role: updatedUser.role }
        });

        return { user: updatedUser, type: 'login' };
      }
      throw new UnauthorizedException('OTP expired');
    }

    // 2. Check Onboarding table
    const onboarding = await this.prisma.publisherOnboarding.findFirst({
      where: { email, otp: code, status: { not: OnboardingStatus.completed } }
    });

    if (onboarding) {
      const now = new Date();
      if (onboarding.otpExpiresAt && onboarding.otpExpiresAt > now) {
        // For new readers, we can auto-create the account upon OTP verification if it's a simple flow
        if (onboarding.requestedRole === UserRole.reader) {
          let baseUsername = onboarding.username || email.split('@')[0];
          let finalUsername = baseUsername;
          let counter = 1;

          // Ensure unique username
          while (await this.prisma.user.findUnique({ where: { username: finalUsername } })) {
            finalUsername = `${baseUsername}${counter++}`;
          }

          const newUser = await this.prisma.user.create({
            data: {
              email: onboarding.email,
              username: finalUsername,
              firstName: onboarding.firstName,
              lastName: onboarding.lastName,
              name: onboarding.firstName ? `${onboarding.firstName} ${onboarding.lastName || ''}`.trim() : (onboarding.orgName || null),
              role: UserRole.reader,
              passwordHash: onboarding.passwordHash || 'OTP_USER', 
              creditBalance: 10
            }
          });
          await this.prisma.publisherOnboarding.update({
            where: { id: onboarding.id },
            data: { status: OnboardingStatus.completed, otp: null, otpExpiresAt: null }
          });
          await this.auditLogs.createLog({
            userId: newUser.id,
            action: 'READER_REGISTERED',
            resourceType: 'USER',
            resourceId: newUser.id,
            metadata: { email: newUser.email, source: 'OTP_REGISTER' }
          });

          return { user: newUser, type: 'register' };
        }
        
        // For publishers, we just verify and keep them in onboarding
        await this.auditLogs.createLog({
          action: 'PUBLISHER_OTP_VERIFIED',
          resourceType: 'ONBOARDING',
          resourceId: onboarding.id,
          metadata: { email: onboarding.email }
        });
        return { onboarding, type: 'onboarding_verified' };
      }
      throw new UnauthorizedException('OTP expired');
    }

    throw new UnauthorizedException('Invalid OTP');
  }

  async registerSuperAdmin(data: any) {
    const { email, password, secret } = data;

    const systemSecret = this.configService.get<string>('SUPERADMIN_SECRET');
    if (secret !== systemSecret) {
      throw new UnauthorizedException('Invalid registration secret');
    }

    const adminExists = await this.prisma.user.findFirst({
      where: { role: UserRole.admin }
    });

    if (adminExists) {
      throw new ConflictException('SuperAdmin already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    return await this.prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        role: UserRole.admin,
        creditBalance: 1000,
      },
    });
  }

  async register(data: any) {
    const {
      email,
      username,
      password,
      isPublisher,
      orgName,
      orgWebsite,
      rssUrl,
      orgDescription,
      publisherFirstName,
      publisherLastName,
      country,
      city,
      phone,
      businessDoc,
      newspaperLicense
    } = data;

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // Create an onboarding record for EVERY user (Reader, Publisher, or Admin)
    // Passwords will be set via activation link after approval
    let requestedRole: UserRole = UserRole.reader;
    if (data.requestedRole) {
      requestedRole = data.requestedRole as UserRole;
    } else if (isPublisher) {
      requestedRole = UserRole.publisher;
    }

    // Single Admin restriction
    if (requestedRole === UserRole.admin) {
      const adminExists = await this.checkAdminExists();
      if (adminExists) {
        throw new ConflictException('An administrator already exists or a registration is pending.');
      }
    }

    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    await this.prisma.publisherOnboarding.create({
      data: {
        token: crypto.randomUUID(),
        email,
        orgName,
        orgWebsite,
        rssUrl,
        orgDescription,
        firstName: publisherFirstName,
        lastName: publisherLastName,
        passwordHash: hashedPassword,
        status: OnboardingStatus.registered,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    await this.auditLogs.createLog({
      action: 'REGISTRATION_SUBMITTED',
      resourceType: 'ONBOARDING',
      resourceId: email,
      metadata: { email, requestedRole }
    });

    return {
      message: 'Registration submitted! Your account is pending admin approval. You can log in once approved.',
      pendingApproval: true
    };
  }

  async checkAdminExists() {
    const adminUser = await this.prisma.user.findFirst({
      where: { role: UserRole.admin, isDeleted: false } as any
    });

    if (adminUser) return true;

    const pendingAdmin = await this.prisma.publisherOnboarding.findFirst({
      where: {
        requestedRole: UserRole.admin,
        status: { in: [OnboardingStatus.pending, OnboardingStatus.registered, OnboardingStatus.approved] }
      }
    });

    return !!pendingAdmin;
  }

  async getUsers() {
    // We use raw SQL to bypass Prisma Client generation locks (EPERM errors) 
    // and to merge pending onboarding users into the main list.
    const users = await this.prisma.$queryRawUnsafe(`
      SELECT 
        id, email, 
        COALESCE(first_name, '') as "firstName", 
        COALESCE(last_name, '') as "lastName", 
        name,
        org_name as "orgName", 
        org_website as "orgWebsite", 
        phone, city, country, 
        business_doc as "businessDoc", 
        newspaper_license as "newspaperLicense", 
        role::text, 
        credit_balance as "creditBalance", 
        created_at as "createdAt",
        is_deleted as "isDeleted",
        CASE WHEN is_deleted THEN 'Deleted' ELSE 'Active' END as status
      FROM users
      
      UNION ALL
      
      SELECT 
        id, email, 
        COALESCE(first_name, '') as "firstName", 
        COALESCE(last_name, '') as "lastName", 
        TRIM(CONCAT(first_name, ' ', last_name)) as name, 
        org_name as "orgName", 
        org_website as "orgWebsite", 
        phone, city, country, 
        business_doc as "businessDoc", 
        newspaper_license as "newspaperLicense", 
        requested_role::text as role, 
        0 as "creditBalance", 
        created_at as "createdAt",
        false as "isDeleted",
        status::text as status
      FROM publisher_onboarding
      WHERE email NOT IN (SELECT email FROM users) AND status != 'rejected'
      
      ORDER BY "createdAt" DESC
    `);

    return users;
  }

  async validateUser(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;

    const passwordMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!passwordMatch) return null;

    // If account was deleted, restore it upon successful password login
    if ((user as any).isDeleted) {
      return await (this.prisma.user as any).update({
        where: { id: user.id },
        data: {
          isDeleted: false,
          deletedAt: null,
        },
      });
    }

    await this.auditLogs.createLog({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      resourceType: 'USER',
      resourceId: user.id,
      metadata: { email: user.email }
    });

    return user;
  }

  async updateUser(id: string, data: any) {
    try {
      return await (this.prisma.user as any).update({
        where: { id: id as any },
        data: {
          name: data.name,
          role: data.role,
          creditBalance: data.creditBalance ? parseInt(data.creditBalance) : undefined,
        },
      });
    } catch (e: any) {
      if (e.code === 'P2025') {
        // Try updating publisherOnboarding instead
        return await this.prisma.publisherOnboarding.update({
          where: { id } as any,
          data: {
            firstName: data.name,
            requestedRole: data.role as any,
          }
        });
      }
      throw e;
    }
  }

  async softDeleteUser(id: string) {
    try {
      // 1. Fetch user to check role and current deletion status
      const user = await this.prisma.user.findUnique({ where: { id } });
      
      if (!user) {
        // Not a user, check onboarding
        return await this.prisma.publisherOnboarding.delete({ where: { id } });
      }

      // 2. If it's an admin OR it's already soft-deleted, perform a HARD DELETE
      if (user.role === 'admin' || user.isDeleted) {
        // Clear associated data
        await this.prisma.accessLog.deleteMany({ where: { userId: id } });
        
        // Delete the User
        const result = await this.prisma.user.delete({ where: { id } });
        
        // ALSO delete the onboarding record to prevent it from reappearing in the list
        try {
          await this.prisma.publisherOnboarding.delete({ where: { id } });
        } catch (e) {}

        await this.auditLogs.createLog({
          action: 'USER_PERMANENTLY_DELETED',
          resourceType: 'USER',
          resourceId: id,
          metadata: { userId: id, email: result.email, role: user.role }
        });
        return result;
      }

      // 3. Otherwise, perform a SOFT DELETE
      const result = await (this.prisma.user as any).update({
        where: { id: id as any },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      await this.auditLogs.createLog({
        action: 'USER_SOFT_DELETED',
        resourceType: 'USER',
        resourceId: id,
        metadata: { userId: id, email: result.email }
      });

      return result;
    } catch (e: any) {
      throw e;
    }
  }
  async addCredits(userId: string, credits: number) {
    console.log(`Attempting to add ${credits} credits to user ${userId}`);
    try {
      const result = await (this.prisma.user as any).update({
        where: { id: userId },
        data: {
          creditBalance: {
            increment: credits
          }
        }
      });
      console.log('Credits added successfully:', result.id);
      return result;
    } catch (error) {
      console.error('Error in addCredits:', error);
      throw error;
    }
  }

  async deductArticleCredit(userId: string, articleId: string) {
    // 1. Check if user already read this article
    const log = await this.prisma.accessLog.findUnique({
      where: {
        userId_articleId: { userId, articleId }
      }
    });

    if (log) {
      // Already read, just return current user with balance
      return await this.prisma.user.findUnique({ where: { id: userId } });
    }

    // 2. Not read yet, deduct 1 credit and log access
    return await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new UnauthorizedException('User not found');

      // Optional: check if credits > 0, but for now we'll allow negative or just zero out
      const newBalance = Math.max(0, Number(user.creditBalance) - 1);

      const updatedUser = await (tx.user as any).update({
        where: { id: userId },
        data: { creditBalance: newBalance }
      });

      await tx.accessLog.create({
        data: { userId, articleId }
      });

      await this.auditLogs.createLog({
        userId,
        action: 'ARTICLE_READ_DEDUCTION',
        resourceType: 'ARTICLE',
        resourceId: articleId,
        metadata: { prevBalance: user.creditBalance, newBalance }
      });

      return updatedUser;
    });
  }
}
