import { IsString, IsOptional, IsNumber, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListarProdutosDto {
  @ApiPropertyOptional({
    description: 'Termo de busca para nome ou descrição do produto',
    example: 'banana'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por categoria (nome ou ID)',
    example: 'Frutas'
  })
  @IsOptional()
  @IsString()
  categoria?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por estabelecimento (nome ou ID)',
    example: 'Hortifruti Central'
  })
  @IsOptional()
  @IsString()
  estabelecimento?: string;

  @ApiPropertyOptional({
    description: 'Preço mínimo para filtro',
    example: 1.50,
    minimum: 0
  })
  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  @IsNumber()
  precoMin?: number;

  @ApiPropertyOptional({
    description: 'Preço máximo para filtro',
    example: 10.00,
    minimum: 0
  })
  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  @IsNumber()
  precoMax?: number;

  @ApiPropertyOptional({
    description: 'Ordenação dos resultados',
    example: 'preco_asc',
    enum: ['preco_asc', 'preco_desc', 'nome_asc', 'nome_desc', 'created_asc', 'created_desc'],
    default: 'created_desc'
  })
  @IsOptional()
  @IsIn(['preco_asc', 'preco_desc', 'nome_asc', 'nome_desc', 'created_asc', 'created_desc'])
  ordenacao?: string = 'created_desc';

  @ApiPropertyOptional({
    description: 'Número da página',
    example: 1,
    minimum: 1,
    default: 1
  })
  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Número de itens por página',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20
  })
  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  @IsNumber()
  limit?: number = 20;
}
