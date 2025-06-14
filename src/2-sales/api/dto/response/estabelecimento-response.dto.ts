import { ApiProperty } from '@nestjs/swagger';

/**
 * ✅ FASE 4: DTO para Horários de Funcionamento
 */
export class HorarioFuncionamentoDto {
  @ApiProperty({
    description: 'Segunda-feira',
    example: '08:00-18:00'
  })
  segunda?: string;

  @ApiProperty({
    description: 'Terça-feira',
    example: '08:00-18:00'
  })
  terca?: string;

  @ApiProperty({
    description: 'Quarta-feira',
    example: '08:00-18:00'
  })
  quarta?: string;

  @ApiProperty({
    description: 'Quinta-feira',
    example: '08:00-18:00'
  })
  quinta?: string;

  @ApiProperty({
    description: 'Sexta-feira',
    example: '08:00-18:00'
  })
  sexta?: string;

  @ApiProperty({
    description: 'Sábado',
    example: '08:00-14:00'
  })
  sabado?: string;

  @ApiProperty({
    description: 'Domingo',
    example: 'FECHADO'
  })
  domingo?: string;
}

/**
 * ✅ FASE 4: DTO resumido para Estabelecimento (usado em produtos)
 */
export class EstabelecimentoResumoDto {
  @ApiProperty({
    description: 'ID do estabelecimento',
    example: 'uuid-do-estabelecimento'
  })
  id!: string;

  @ApiProperty({
    description: 'Nome do estabelecimento',
    example: 'Hortifruti do João'
  })
  nome!: string;

  @ApiProperty({
    description: 'Avaliação média',
    example: 4.5
  })
  avaliacaoMedia?: number;

  @ApiProperty({
    description: 'Tempo de entrega estimado',
    example: 45
  })
  tempoEntregaEstimado?: number;
}

/**
 * ✅ FASE 4: Response DTO para Estabelecimento público
 * Expõe apenas dados necessários para o catálogo público
 */
export class EstabelecimentoPublicoDto {
  @ApiProperty({
    description: 'ID único do estabelecimento',
    example: 'uuid-do-estabelecimento'
  })
  id!: string;

  @ApiProperty({
    description: 'Nome do estabelecimento',
    example: 'Hortifruti do João'
  })
  nome!: string;

  @ApiProperty({
    description: 'Descrição do estabelecimento',
    example: 'Frutas, verduras e legumes frescos'
  })
  descricao?: string;

  @ApiProperty({
    description: 'Endereço do estabelecimento',
    example: 'Rua das Flores, 123 - Centro'
  })
  endereco!: string;

  @ApiProperty({
    description: 'Cidade',
    example: 'São Paulo'
  })
  cidade!: string;

  @ApiProperty({
    description: 'Estado',
    example: 'SP'
  })
  estado!: string;

  @ApiProperty({
    description: 'Avaliação média',
    example: 4.5,
    minimum: 0,
    maximum: 5
  })
  avaliacaoMedia?: number;

  @ApiProperty({
    description: 'Número total de avaliações',
    example: 127
  })
  totalAvaliacoes?: number;

  @ApiProperty({
    description: 'Tempo estimado de entrega em minutos',
    example: 45
  })
  tempoEntregaEstimado?: number;

  @ApiProperty({
    description: 'Taxa de entrega',
    example: 5.90
  })
  taxaEntrega?: number;

  @ApiProperty({
    description: 'Valor mínimo para pedido',
    example: 20.00
  })
  valorMinimoPedido?: number;

  @ApiProperty({
    description: 'Status do estabelecimento',
    example: 'ABERTO'
  })
  status!: string;

  @ApiProperty({
    description: 'Horários de funcionamento',
    type: HorarioFuncionamentoDto,
    required: false
  })
  horariosFuncionamento?: HorarioFuncionamentoDto;

  @ApiProperty({
    description: 'Categorias de produtos oferecidos',
    type: [String],
    example: ['Frutas', 'Verduras', 'Legumes']
  })
  categorias?: string[];

  @ApiProperty({
    description: 'URL da imagem do estabelecimento',
    example: '/uploads/establishments/logo.jpg'
  })
  imagemUrl?: string;
}

/**
 * ✅ FASE 4: Response DTO para Produto público
 */
export class ProdutoPublicoDto {
  @ApiProperty({
    description: 'ID único do produto',
    example: 'uuid-do-produto'
  })
  id!: string;

  @ApiProperty({
    description: 'Nome do produto',
    example: 'Maçã Vermelha'
  })
  nome!: string;

  @ApiProperty({
    description: 'Descrição do produto',
    example: 'Maçã vermelha doce e crocante'
  })
  descricao?: string;

  @ApiProperty({
    description: 'Preço atual',
    example: 4.50
  })
  preco!: number;

  @ApiProperty({
    description: 'Preço original (antes de promoções)',
    example: 5.00
  })
  precoOriginal?: number;

  @ApiProperty({
    description: 'Unidade de medida',
    example: 'kg'
  })
  unidade!: string;

  @ApiProperty({
    description: 'Categoria do produto',
    example: 'Frutas'
  })
  categoria!: string;

  @ApiProperty({
    description: 'Disponível em estoque',
    example: true
  })
  disponivel!: boolean;

  @ApiProperty({
    description: 'Quantidade em estoque',
    example: 50
  })
  estoque?: number;

  @ApiProperty({
    description: 'URL da imagem do produto',
    example: '/uploads/products/maca.jpg'
  })
  imagemUrl?: string;

  @ApiProperty({
    description: 'Informações do estabelecimento',
    type: EstabelecimentoResumoDto
  })
  estabelecimento!: EstabelecimentoResumoDto;
}
