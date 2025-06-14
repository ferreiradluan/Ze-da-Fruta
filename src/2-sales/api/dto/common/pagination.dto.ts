import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsInt, Min, Max, IsString, IsIn } from 'class-validator';

/**
 * ✅ FASE 4: DTO de Paginação para endpoints públicos
 */
export class PaginacaoDto {
  @ApiPropertyOptional({
    description: 'Número da página',
    example: 1,
    minimum: 1,
    default: 1
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value) || 1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Itens por página',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value) || 20)
  limit?: number = 20;
}

/**
 * ✅ FASE 4: Metadados de paginação
 */
export class PaginationMetaDto {
  @ApiProperty({
    description: 'Página atual',
    example: 1
  })
  currentPage!: number;

  @ApiProperty({
    description: 'Total de páginas',
    example: 5
  })
  totalPages!: number;

  @ApiProperty({
    description: 'Total de itens',
    example: 98
  })
  totalItems!: number;

  @ApiProperty({
    description: 'Itens por página',
    example: 20
  })
  itemsPerPage!: number;

  @ApiProperty({
    description: 'Tem página anterior',
    example: false
  })
  hasPreviousPage!: boolean;

  @ApiProperty({
    description: 'Tem próxima página',
    example: true
  })
  hasNextPage!: boolean;
}

/**
 * ✅ FASE 4: Response DTO para dados paginados
 */
export class PaginatedResponseDto<T> {
  @ApiProperty({
    description: 'Array de dados da página atual'
  })
  data!: T[];

  @ApiProperty({
    description: 'Metadados da paginação',
    type: PaginationMetaDto
  })
  meta!: PaginationMetaDto;
}

/**
 * ✅ FASE 4: Filtros para estabelecimentos
 */
export class FiltrosEstabelecimentoDto extends PaginacaoDto {
  @ApiPropertyOptional({
    description: 'Filtrar por cidade',
    example: 'São Paulo'
  })
  @IsOptional()
  @IsString()
  cidade?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por categoria de produtos',
    example: 'Frutas'
  })
  @IsOptional()
  @IsString()
  categoria?: string;

  @ApiPropertyOptional({
    description: 'Nome ou parte do nome do estabelecimento',
    example: 'Hortifruti'
  })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({
    description: 'Raio de busca em quilômetros',
    example: 5
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Transform(({ value }) => parseInt(value))
  raio?: number;

  @ApiPropertyOptional({
    description: 'Latitude para busca por proximidade',
    example: -23.5505
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude para busca por proximidade',
    example: -46.6333
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Ordenação dos resultados',
    example: 'avaliacao_desc',
    enum: ['nome_asc', 'nome_desc', 'avaliacao_asc', 'avaliacao_desc', 'tempo_entrega_asc', 'tempo_entrega_desc', 'distancia_asc'],
    default: 'avaliacao_desc'
  })
  @IsOptional()
  @IsIn(['nome_asc', 'nome_desc', 'avaliacao_asc', 'avaliacao_desc', 'tempo_entrega_asc', 'tempo_entrega_desc', 'distancia_asc'])
  ordenacao?: string = 'avaliacao_desc';
}

/**
 * ✅ FASE 4: Filtros para produtos públicos
 */
export class FiltrosProdutosDto extends PaginacaoDto {
  @ApiPropertyOptional({
    description: 'Nome ou parte do nome do produto',
    example: 'maçã'
  })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({
    description: 'Categoria do produto',
    example: 'Frutas'
  })
  @IsOptional()
  @IsString()
  categoria?: string;

  @ApiPropertyOptional({
    description: 'ID do estabelecimento',
    example: 'uuid-do-estabelecimento'
  })
  @IsOptional()
  @IsString()
  estabelecimento?: string;

  @ApiPropertyOptional({
    description: 'Nome do estabelecimento',
    example: 'Hortifruti do João'
  })
  @IsOptional()
  @IsString()
  nomeEstabelecimento?: string;

  @ApiPropertyOptional({
    description: 'Preço mínimo',
    example: 2.00
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  precoMin?: number;

  @ApiPropertyOptional({
    description: 'Preço máximo',
    example: 10.00
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  precoMax?: number;

  @ApiPropertyOptional({
    description: 'Apenas produtos disponíveis',
    example: true,
    default: true
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  apenasDisponiveis?: boolean = true;

  @ApiPropertyOptional({
    description: 'Ordenação dos resultados',
    example: 'preco_asc',
    enum: ['preco_asc', 'preco_desc', 'nome_asc', 'nome_desc', 'relevancia'],
    default: 'relevancia'
  })
  @IsOptional()
  @IsIn(['preco_asc', 'preco_desc', 'nome_asc', 'nome_desc', 'relevancia'])
  ordenacao?: string = 'relevancia';
}
