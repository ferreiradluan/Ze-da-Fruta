import { IsString, IsNumber, IsOptional, IsDate, IsBoolean, Min, IsUrl, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { UnitType, SeasonalityType } from './create-product.dto';

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  weight?: number;

  @IsEnum(UnitType)
  @IsOptional()
  unit?: UnitType;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  expirationDate?: Date;

  @IsNumber()
  @Min(0)
  @IsOptional()
  stockQuantity?: number;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsEnum(SeasonalityType)
  @IsOptional()
  seasonality?: SeasonalityType;

  @IsNumber()
  @IsOptional()
  categoryId?: number;
}