import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MasterService {
  constructor(private prisma: PrismaService) {}

  // --- Country Methods ---
  async getCountries() {
    return this.prisma.country.findMany({
      include: { _count: { select: { cities: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createCountry(data: any) {
    return this.prisma.country.create({
      data: {
        name: data.name,
        isoCode: data.isoCode,
        mobileCode: data.mobileCode,
        currency: data.currency,
        currencySymbol: data.currencySymbol,
        status: 'active',
      },
    });
  }

  async updateCountry(id: string, data: any) {
    return this.prisma.country.update({
      where: { id },
      data: {
        name: data.name,
        isoCode: data.isoCode,
        mobileCode: data.mobileCode,
        currency: data.currency,
        currencySymbol: data.currencySymbol,
        status: data.status || 'active',
      },
    });
  }

  async deleteCountry(id: string) {
    return this.prisma.country.delete({ where: { id } });
  }

  // --- City Methods ---
  async getCities(countryId?: string) {
    const where = countryId ? { countryId } : {};
    return this.prisma.city.findMany({
      where,
      include: { country: true },
      orderBy: { name: 'asc' },
    });
  }

  async createCity(data: any) {
    const country = await this.prisma.country.findFirst({
      where: { name: data.country },
    });

    if (!country) throw new NotFoundException('Country not found');

    return this.prisma.city.create({
      data: {
        name: data.name,
        countryId: country.id,
        status: 'active',
      },
    });
  }

  async updateCity(id: string, data: any) {
    const country = await this.prisma.country.findFirst({
      where: { name: data.country },
    });

    if (!country) throw new NotFoundException('Country not found');

    return this.prisma.city.update({
      where: { id },
      data: {
        name: data.name,
        countryId: country.id,
        status: data.status,
      },
    });
  }

  async deleteCity(id: string) {
    return this.prisma.city.delete({ where: { id } });
  }
}
