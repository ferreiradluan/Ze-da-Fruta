import { ApiProperty } from '@nestjs/swagger';

/**
 * 🔧 FASE 4: RESPONSE DTOs OTIMIZADOS
 * 
 * ✅ APENAS dados necessários para o cliente
 * ✅ Sem dados sensíveis
 * ✅ Estrutura bem definida
 */

export class ItemPedidoResponseDto {
  @ApiProperty({ description: 'ID do item' })
  id: string;

  @ApiProperty({ description: 'Nome do produto' })
  nomeProduto: string;

  @ApiProperty({ description: 'Quantidade' })
  quantidade: number;

  @ApiProperty({ description: 'Preço unitário' })
  precoUnitario: number;

  @ApiProperty({ description: 'Preço total do item' })
  precoTotal: number;

  @ApiProperty({ description: 'URL da imagem do produto', required: false })
  imagemUrl?: string;
}

export class PedidoResponseDto {
  @ApiProperty({ description: 'ID do pedido' })
  id: string;

  @ApiProperty({ description: 'Status do pedido' })
  status: string;

  @ApiProperty({ description: 'Valor total do pedido' })
  valorTotal: number;

  @ApiProperty({ description: 'Valor do subtotal' })
  valorSubtotal: number;

  @ApiProperty({ description: 'Valor do desconto', required: false })
  valorDesconto?: number;

  @ApiProperty({ description: 'Taxa de entrega' })
  taxaEntrega: number;

  @ApiProperty({ description: 'Data de criação' })
  criadoEm: Date;

  @ApiProperty({ description: 'Data de confirmação', required: false })
  confiriadoEm?: Date;

  @ApiProperty({ type: [ItemPedidoResponseDto] })
  itens: ItemPedidoResponseDto[];

  @ApiProperty({ description: 'Nome do estabelecimento' })
  nomeEstabelecimento: string;

  @ApiProperty({ description: 'Código do cupom aplicado', required: false })
  cupomAplicado?: string;
}

export class EstabelecimentoPublicoDto {
  @ApiProperty({ description: 'ID do estabelecimento' })
  id: string;

  @ApiProperty({ description: 'Nome do estabelecimento' })
  nome: string;

  @ApiProperty({ description: 'Descrição' })
  descricao: string;

  @ApiProperty({ description: 'Endereço' })
  endereco: string;

  @ApiProperty({ description: 'Telefone', required: false })
  telefone?: string;

  @ApiProperty({ description: 'URL da imagem', required: false })
  imagemUrl?: string;

  @ApiProperty({ description: 'Está aberto para pedidos' })
  estaAberto: boolean;

  @ApiProperty({ description: 'Tempo médio de entrega em minutos' })
  tempoEntrega: number;

  @ApiProperty({ description: 'Taxa de entrega' })
  taxaEntrega: number;

  @ApiProperty({ description: 'Avaliação média', required: false })
  avaliacaoMedia?: number;
}

export class ProdutoPublicoDto {
  @ApiProperty({ description: 'ID do produto' })
  id: string;

  @ApiProperty({ description: 'Nome do produto' })
  nome: string;

  @ApiProperty({ description: 'Descrição' })
  descricao: string;

  @ApiProperty({ description: 'Preço' })
  preco: number;

  @ApiProperty({ description: 'Preço promocional', required: false })
  precoPromocional?: number;

  @ApiProperty({ description: 'URL da imagem', required: false })
  imagemUrl?: string;

  @ApiProperty({ description: 'Disponível em estoque' })
  disponivel: boolean;

  @ApiProperty({ description: 'Quantidade em estoque' })
  estoque: number;

  @ApiProperty({ description: 'Unidade de medida' })
  unidade: string;

  @ApiProperty({ description: 'Nome do estabelecimento' })
  nomeEstabelecimento: string;

  @ApiProperty({ description: 'Categorias do produto' })
  categorias: string[];
}

export class CategoriaPublicaDto {
  @ApiProperty({ description: 'ID da categoria' })
  id: string;

  @ApiProperty({ description: 'Nome da categoria' })
  nome: string;

  @ApiProperty({ description: 'Descrição', required: false })
  descricao?: string;

  @ApiProperty({ description: 'URL da imagem', required: false })
  imagemUrl?: string;

  @ApiProperty({ description: 'Quantidade de produtos ativos' })
  quantidadeProdutos: number;
}

export class PaginacaoResponseDto<T> {
  @ApiProperty({ description: 'Dados da página atual' })
  data: T[];

  @ApiProperty({ description: 'Página atual' })
  pagina: number;

  @ApiProperty({ description: 'Itens por página' })
  limite: number;

  @ApiProperty({ description: 'Total de itens' })
  total: number;

  @ApiProperty({ description: 'Total de páginas' })
  totalPaginas: number;

  @ApiProperty({ description: 'Possui próxima página' })
  proximaPagina: boolean;

  @ApiProperty({ description: 'Possui página anterior' })
  paginaAnterior: boolean;
}
