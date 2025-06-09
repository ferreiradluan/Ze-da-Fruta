import { IsString, IsOptional, IsNumber, IsBoolean, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProdutoDto {
  @ApiPropertyOptional({
    description: 'Nome do produto',
    example: 'Banana Prata Premium'
  })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({
    description: 'Preço do produto em reais',
    example: 3.49,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  preco?: number;

  @ApiPropertyOptional({
    description: 'Descrição do produto',
    example: 'Banana prata premium selecionada'
  })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiPropertyOptional({
    description: 'URL da imagem do produto',
    example: '/uploads/product/banana-premium.png'
  })
  @IsOptional()
  @IsString()
  imagemUrl?: string;

  @ApiPropertyOptional({
    description: 'Status de ativação do produto',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @ApiPropertyOptional({
    description: 'Quantidade em estoque',
    example: 50,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  estoque?: number;

  @ApiPropertyOptional({
    description: 'Unidade de medida',
    example: 'kg'
  })
  @IsOptional()
  @IsString()
  unidadeMedida?: string;

  @ApiPropertyOptional({
    description: 'ID da categoria',
    example: 'uuid-da-categoria',
    format: 'uuid'
  })
  @IsOptional()
  @IsUUID()
  categoriaId?: string;

  @ApiPropertyOptional({
    description: 'ID do estabelecimento',
    example: 'uuid-do-estabelecimento',
    format: 'uuid'
  })
  @IsOptional()
  @IsUUID()
  estabelecimentoId?: string;
}
