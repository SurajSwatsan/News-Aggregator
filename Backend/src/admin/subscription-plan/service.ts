import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubscriptionPlanDto } from './dto';

@Injectable()
export class SubscriptionPlanService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSubscriptionPlanDto) {
    return this.prisma.subscriptionPlan.create({
      data: {
        name: dto.name,
        billingCycle: dto.billingCycle,
        price: dto.price,
        currency: dto.currency,
        features: dto.features || [],
        credits: dto.credits || 0,
        validityDays: dto.validityDays || 365,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        subscriptions: dto.subscriptions || {},
        createdBy: dto.createdBy || 'Admin'
      },
    });
  }

  async findAll() {
    return this.prisma.subscriptionPlan.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });
  }

  async update(id: string, dto: Partial<CreateSubscriptionPlanDto>) {
    return this.prisma.subscriptionPlan.update({
      where: { id },
      data: dto as any,
    });
  }

  async remove(id: string) {
    return this.prisma.subscriptionPlan.delete({
      where: { id },
    });
  }
}
