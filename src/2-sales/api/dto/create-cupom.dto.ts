import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { TipoDesconto, TIPO_DESCONTO } from '../../domain/entities/cupom.entity';

export class CreateCupomDto {
  @ApiProperty({
    description: 'Código único do cupom',
    example: 'DESCONTO10'
  })
  @IsString()  codigo?: string;
  @ApiProperty({
    description: 'Tipo de desconto',
    enum: Object.values(TIPO_DESCONTO),
    example: TIPO_DESCONTO.PERCENTUAL
  })
  @IsIn(Object.values(TIPO_DESCONTO))
  tipoDesconto?: string;

  @ApiProperty({
    description: 'Valor do desconto (porcentagem ou valor fixo)',
    example: 10,
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  valor?: number;

  @ApiProperty({
    description: 'Data de validade do cupom',
    example: '2025-12-31T23:59:59.000Z'
  })
  @IsDateString()
  dataValidade?: string;

  @ApiPropertyOptional({
    description: 'Valor mínimo para aplicar o cupom',
    example: 20.00,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  valorMinimoCompra?: number;

  @ApiPropertyOptional({
    description: 'Valor máximo de desconto (para cupons percentuais)',
    example: 50.00,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  valorMaximoDesconto?: number;

  @ApiPropertyOptional({
    description: 'Número limite de usos do cupom',
    example: 100,
    minimum: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limitesUso?: number;

  @ApiPropertyOptional({
    description: 'Status ativo do cupom',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

export class UpdateCupomDto {
  @ApiPropertyOptional({
    description: 'Data de validade do cupom',
    example: '2025-12-31T23:59:59.000Z'
  })
  @IsOptional()
  @IsDateString()
  dataValidade?: string;

  @ApiPropertyOptional({
    description: 'Status ativo do cupom',
    example: false
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @ApiPropertyOptional({
    description: 'Número limite de usos do cupom',
    example: 200,
    minimum: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limitesUso?: number;
}
