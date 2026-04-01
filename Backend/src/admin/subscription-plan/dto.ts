import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsArray, IsObject } from 'class-validator';

export class CreateSubscriptionPlanDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  billingCycle: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[];

  @IsNumber()
  @IsOptional()
  credits?: number;

  @IsNumber()
  @IsOptional()
  validityDays?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsObject()
  @IsOptional()
  subscriptions?: any;

  @IsString()
  @IsOptional()
  createdBy?: string;
}
