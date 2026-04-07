import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdService {
  constructor(private prisma: PrismaService) {}

  async createAd(data: any, creatorId: string) {
    // Admin ads are automatically set to active and bypass the workflow
    const initialStatus =
      creatorId === 'ADMIN' ? 'active' : data.status || 'pending';

    return this.prisma.advertisement.create({
      data: {
        title: data.title,
        adType: data.ad_type || data.adType,
        mediaUrl: data.media_url || data.mediaUrl,
        targetUrl: data.target_url || data.targetUrl,
        placementType: data.placement_type || data.placementType,
        position: data.position || 0,
        createdBy: creatorId,
        status: initialStatus,
        isActive: data.is_active !== undefined ? data.is_active : true,
        startTime: data.startTime ? new Date(data.startTime) : null,
        endTime: data.endTime ? new Date(data.endTime) : null,
      },
    });
  }

  async getAllAds() {
    return this.prisma.advertisement.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPublisherAds(userId: string, type?: string, search?: string) {
    const where: any = { createdBy: userId };

    if (type && type !== 'all') {
      where.adType = type;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { targetUrl: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.advertisement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getActiveAds(placementType?: string) {
    return this.prisma.advertisement.findMany({
      where: {
        isActive: true,
        OR: [
          { status: 'active' },
          { createdBy: 'ADMIN' }, // Admin ads are always available if active
        ],
        ...(placementType ? { placementType } : {}),
      },
      orderBy: { position: 'asc' },
    });
  }

  async trackImpression(adId: string) {
    return this.prisma.advertisement.update({
      where: { id: adId },
      data: { impressions: { increment: 1 } },
    });
  }

  async trackClick(adId: string) {
    return this.prisma.advertisement.update({
      where: { id: adId },
      data: { clicks: { increment: 1 } },
    });
  }

  async updateAdStatus(adId: string, status: string, isActive: boolean) {
    return this.prisma.advertisement.update({
      where: { id: adId },
      data: { status, isActive },
    });
  }

  async updateAd(adId: string, data: any) {
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.adType !== undefined) updateData.adType = data.adType;
    if (data.mediaUrl !== undefined) updateData.mediaUrl = data.mediaUrl;
    if (data.targetUrl !== undefined) updateData.targetUrl = data.targetUrl;
    if (data.placementType !== undefined)
      updateData.placementType = data.placementType;
    if (data.position !== undefined) updateData.position = data.position;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.startTime !== undefined)
      updateData.startTime = data.startTime ? new Date(data.startTime) : null;
    if (data.endTime !== undefined)
      updateData.endTime = data.endTime ? new Date(data.endTime) : null;

    return this.prisma.advertisement.update({
      where: { id: adId },
      data: updateData,
    });
  }

  async deleteAd(adId: string) {
    return this.prisma.advertisement.delete({
      where: { id: adId },
    });
  }
}
