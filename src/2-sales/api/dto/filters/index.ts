import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

/**
 * 🔧 FASE 4: FILTROS E PAGINAÇÃO OTIMIZADOS
 * 
 * ✅ Validação automática
 * ✅ Transformação de tipos
 * ✅ Documentação completa
 */

export class PaginacaoDto {
  @ApiProperty({ 
    description: 'Número da página', 
    default: 1, 
    minimum: 1,
    required: false 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pagina?: number = 1;

  @ApiProperty({ 
    description: 'Itens por página', 
    default: 10, 
    minimum: 1, 
    maximum: 100,
    required: false 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limite?: number = 10;

  // Calculado automaticamente
  get offset(): number {
    return (this.pagina! - 1) * this.limite!;
  }
}

export class FiltrosEstabelecimentoDto extends PaginacaoDto {
  @ApiProperty({ 
    description: 'Nome do estabelecimento para busca', 
    required: false 
  })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiProperty({ 
    description: 'Cidade do estabelecimento', 
    required: false 
  })
  @IsOptional()
  @IsString()
  cidade?: string;

  @ApiProperty({ 
    description: 'Categoria de produtos', 
    required: false 
  })
  @IsOptional()
  @IsString()
  categoria?: string;

  @ApiProperty({ 
    description: 'Apenas estabelecimentos abertos', 
    required: false,
    default: true
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  apenasAbertos?: boolean = true;
}

export class FiltrosProdutoDto extends PaginacaoDto {
  @ApiProperty({ 
    description: 'Nome do produto para busca', 
    required: false 
  })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiProperty({ 
    description: 'Categoria do produto', 
    required: false 
  })
  @IsOptional()
  @IsString()
  categoria?: string;

  @ApiProperty({ 
    description: 'Nome do estabelecimento', 
    required: false 
  })
  @IsOptional()
  @IsString()
  estabelecimento?: string;

  @ApiProperty({ 
    description: 'ID do estabelecimento', 
    required: false 
  })
  @IsOptional()
  @IsString()
  estabelecimentoId?: string;

  @ApiProperty({ 
    description: 'Preço mínimo', 
    required: false 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precoMinimo?: number;

  @ApiProperty({ 
    description: 'Preço máximo', 
    required: false 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precoMaximo?: number;

  @ApiProperty({ 
    description: 'Apenas produtos disponíveis', 
    required: false,
    default: true
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  apenasDisponiveis?: boolean = true;

  @ApiProperty({ 
    description: 'Ordenação dos resultados',
    enum: ['nome', 'preco', 'relevancia'],
    required: false,
    default: 'relevancia'
  })
  @IsOptional()
  @IsString()
  ordenacao?: 'nome' | 'preco' | 'relevancia' = 'relevancia';

  @ApiProperty({ 
    description: 'Direção da ordenação',
    enum: ['asc', 'desc'],
    required: false,
    default: 'asc'
  })
  @IsOptional()
  @IsString()
  direcao?: 'asc' | 'desc' = 'asc';
}

export class FiltrosCategoriaDto extends PaginacaoDto {
  @ApiProperty({ 
    description: 'Nome da categoria para busca', 
    required: false 
  })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiProperty({ 
    description: 'Apenas categorias ativas', 
    required: false,
    default: true
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  apenasAtivas?: boolean = true;
}

export class FiltrosPedidoDto extends PaginacaoDto {
  @ApiProperty({ 
    description: 'Status do pedido',
    enum: ['RASCUNHO', 'CONFIRMADO', 'PREPARANDO', 'SAIU_ENTREGA', 'ENTREGUE', 'CANCELADO'],
    required: false 
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ 
    description: 'Data inicial (YYYY-MM-DD)', 
    required: false 
  })
  @IsOptional()
  @IsString()
  dataInicial?: string;

  @ApiProperty({ 
    description: 'Data final (YYYY-MM-DD)', 
    required: false 
  })
  @IsOptional()
  @IsString()
  dataFinal?: string;

  @ApiProperty({ 
    description: 'ID do estabelecimento', 
    required: false 
  })
  @IsOptional()
  @IsString()
  estabelecimentoId?: string;
}
