import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MasterService {
  constructor(private prisma: PrismaService) {}

  // --- Country Methods ---
  async getCountries() {
    return this.prisma.country.findMany({
      include: { 
        _count: { select: { states: true, cities: true } } 
      },
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

  // --- State Methods ---
  async getStates(countryId?: string) {
    const where = countryId ? { countryId } : {};
    return this.prisma.state.findMany({
      where,
      include: { country: true, _count: { select: { cities: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createState(data: any) {
    const country = await this.prisma.country.findFirst({
      where: { name: data.country }
    });
    if (!country) throw new NotFoundException('Country not found');

    return this.prisma.state.create({
      data: {
        name: data.name,
        countryId: country.id,
        status: 'active',
      },
    });
  }

  async updateState(id: string, data: any) {
    const country = await this.prisma.country.findFirst({
      where: { name: data.country }
    });
    if (!country) throw new NotFoundException('Country not found');

    return this.prisma.state.update({
      where: { id },
      data: {
        name: data.name,
        countryId: country.id,
        status: data.status || 'active',
      },
    });
  }

  async deleteState(id: string) {
    return this.prisma.state.delete({ where: { id } });
  }

  // --- City Methods ---
  async getCities(countryId?: string, stateId?: string) {
    const where: any = {};
    if (countryId) where.countryId = countryId;
    if (stateId) where.stateId = stateId;

    return this.prisma.city.findMany({
      where,
      include: { country: true, state: true },
      orderBy: { name: 'asc' },
    });
  }

  async createCity(data: any) {
    const country = await this.prisma.country.findFirst({
      where: { name: data.country },
    });
<<<<<<< HEAD

=======
>>>>>>> 71079a29c9e6895199c0572cf8ea02c4170efe7c
    if (!country) throw new NotFoundException('Country not found');

    let stateId = null;
    if (data.state) {
      const state = await this.prisma.state.findFirst({
        where: { name: data.state, countryId: country.id }
      });
      if (state) stateId = state.id;
    }

    return this.prisma.city.create({
      data: {
        name: data.name,
        countryId: country.id,
        stateId: stateId,
        status: 'active',
      },
    });
  }

  async updateCity(id: string, data: any) {
    const country = await this.prisma.country.findFirst({
      where: { name: data.country },
    });
<<<<<<< HEAD

=======
>>>>>>> 71079a29c9e6895199c0572cf8ea02c4170efe7c
    if (!country) throw new NotFoundException('Country not found');

    let stateId = null;
    if (data.state) {
      const state = await this.prisma.state.findFirst({
        where: { name: data.state, countryId: country.id }
      });
      if (state) stateId = state.id;
    }

    return this.prisma.city.update({
      where: { id },
      data: {
        name: data.name,
        countryId: country.id,
        stateId: stateId,
        status: data.status,
      },
    });
  }

  async deleteCity(id: string) {
    return this.prisma.city.delete({ where: { id } });
  }
}
