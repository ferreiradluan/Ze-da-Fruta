import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProdutoDto {
  @ApiProperty({
    description: 'Nome do produto',
    example: 'Banana Prata',
    maxLength: 255
  })
  @IsString()
  @IsNotEmpty()  nome?: string;

  @ApiProperty({
    description: 'Preço do produto em reais',
    example: 2.99,
    minimum: 0
  })
  @IsNumber()
  preco?: number;

  @ApiPropertyOptional({
    description: 'Descrição detalhada do produto',
    example: 'Banana prata doce e nutritiva, ideal para vitaminas',
    maxLength: 1000
  })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiPropertyOptional({
    description: 'URL da imagem do produto',
    example: '/uploads/product/banana-prata.png'
  })
  @IsOptional()
  @IsString()
  imagemUrl?: string;

  @ApiPropertyOptional({
    description: 'Status de ativação do produto',
    example: true,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean = true;

  @ApiPropertyOptional({
    description: 'Quantidade em estoque',
    example: 100,
    minimum: 0,
    default: 0
  })
  @IsOptional()
  @IsNumber()
  estoque?: number = 0;

  @ApiPropertyOptional({
    description: 'Unidade de medida do produto',
    example: 'kg',
    enum: ['kg', 'unidade', 'litro', 'pacote', 'caixa']
  })
  @IsOptional()
  @IsString()
  unidadeMedida?: string;

  @ApiPropertyOptional({
    description: 'ID da categoria do produto',
    example: 'uuid-da-categoria',
    format: 'uuid'
  })
  @IsOptional()
  @IsUUID()
  categoriaId?: string;

  @ApiPropertyOptional({
    description: 'ID do estabelecimento onde o produto será vendido',
    example: 'uuid-do-estabelecimento',
    format: 'uuid'
  })
  @IsOptional()
  @IsUUID()
  estabelecimentoId?: string;

  @ApiPropertyOptional({
    description: 'ID do parceiro/vendedor (preenchido automaticamente para partners)',
    example: 'uuid-do-parceiro'
  })
  @IsOptional()
  @IsString()
  partnerId?: string;
}
