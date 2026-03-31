import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { MasterService } from './master.service';

@Controller('master')
export class MasterController {
  constructor(private readonly masterService: MasterService) {}

  @Get('countries')
  getCountries() {
    return this.masterService.getCountries();
  }

  @Post('countries')
  createCountry(@Body() data: any) {
    return this.masterService.createCountry(data);
  }

  @Put('countries/:id')
  updateCountry(@Param('id') id: string, @Body() data: any) {
    return this.masterService.updateCountry(id, data);
  }

  @Delete('countries/:id')
  deleteCountry(@Param('id') id: string) {
    return this.masterService.deleteCountry(id);
  }

  @Get('cities')
  getCities() {
    return this.masterService.getCities();
  }

  @Post('cities')
  createCity(@Body() data: any) {
    return this.masterService.createCity(data);
  }

  @Put('cities/:id')
  updateCity(@Param('id') id: string, @Body() data: any) {
    return this.masterService.updateCity(id, data);
  }

  @Delete('cities/:id')
  deleteCity(@Param('id') id: string) {
    return this.masterService.deleteCity(id);
  }
}
