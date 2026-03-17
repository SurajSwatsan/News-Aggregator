import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, OnboardingStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

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
      password, 
      isPublisher,
      orgName,
      orgWebsite,
      rssUrl,
      orgDescription,
      publisherName,
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

    await this.prisma.publisherOnboarding.create({
      data: {
        token: crypto.randomUUID(),
        email,
        orgName,
        orgWebsite,
        rssUrl,
        orgDescription,
        publisherName,
        country,
        city,
        phone,
        businessDoc,
        newspaperLicense,
        requestedRole,
        status: OnboardingStatus.registered,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return { 
      message: 'Registration submitted! Please wait for admin approval.',
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
        id, email, name, 
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
        id, email, publisher_name as name, 
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
      WHERE email NOT IN (SELECT email FROM users)
      
      ORDER BY "createdAt" DESC
    `);
    
    return users;
  }

  async validateUser(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && (user as any).isDeleted) {
      throw new UnauthorizedException('Account has been deleted');
    }
    if (user && await bcrypt.compare(pass, user.passwordHash)) {
      return user;
    }
    return null;
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
            publisherName: data.name,
            requestedRole: data.role as any,
          }
        });
      }
      throw e;
    }
  }

  async softDeleteUser(id: string) {
    try {
      return await (this.prisma.user as any).update({
        where: { id: id as any },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });
    } catch (e: any) {
      if (e.code === 'P2025') {
        // Simply remove the onboarding request if it's not a user yet
        return await this.prisma.publisherOnboarding.delete({
          where: { id } as any
        });
      }
      throw e;
    }
  }

  async restoreUser(id: string) {
    return await (this.prisma.user as any).update({
      where: { id: id as any },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
    });
  }
}
