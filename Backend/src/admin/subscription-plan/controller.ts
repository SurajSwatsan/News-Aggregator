import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { SubscriptionPlanService } from './service';
import { CreateSubscriptionPlanDto } from './dto';

@Controller('subscription-plans')
export class SubscriptionPlanController {
  constructor(private readonly service: SubscriptionPlanService) {}

  @Post()
  create(@Body() dto: CreateSubscriptionPlanDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateSubscriptionPlanDto>) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
