import { IsString, IsNumber, IsOptional, IsDate, IsBoolean, Min, IsUrl, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum UnitType {
  KG = 'kg',
  UNIDADE = 'unidade',
  CAIXA = 'caixa',
  DÚZIA = 'dúzia'
}

export enum SeasonalityType {
  VERAO = 'Verão',
  INVERNO = 'Inverno',
  PRIMAVERA = 'Primavera',
  OUTONO = 'Outono',
  ANO_TODO = 'Ano todo'
}

export class CreateProductDto {
  @IsString()
  name!: string;

  @IsString()
  description!: string;

  @IsNumber()
  @Min(0)
  price!: number;

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
  categoryId!: number;
}