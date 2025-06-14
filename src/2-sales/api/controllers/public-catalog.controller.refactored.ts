import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../../common/decorators/public.decorator';
import { SalesService } from '../../application/services/sales.service';
import { CategoriaService } from '../../application/services/categoria.service';
import { EstabelecimentoService } from '../../application/services/estabelecimento.service';

/**
 * 🔧 FASE 4: PUBLICCATALOGCONTROLLER OTIMIZADO PARA REST
 * 
 * ✅ Padrões REST corretos para catálogo público
 * ✅ Endpoints focados em consultas públicas
 * ✅ Estrutura REST resource-based
 */
@ApiTags('🛍️ Public Catalog')
@Controller('catalog')
export class PublicCatalogController {
  constructor(
    private readonly salesService: SalesService,
    private readonly categoriaService: CategoriaService,
    private readonly estabelecimentoService: EstabelecimentoService
  ) {}

  // ===== ESTABLISHMENTS =====

  /**
   * ✅ REST: GET /catalog/establishments - Listar estabelecimentos
   */
  @Get('establishments')
  @Public()
  @ApiOperation({
    summary: 'Listar estabelecimentos públicos',
    description: 'Lista todos os estabelecimentos disponíveis para o público'
  })
  @ApiQuery({
    name: 'cidade',
    required: false,
    type: 'string',
    description: 'Filtrar por cidade'
  })
  @ApiQuery({
    name: 'categoria',
    required: false,
    type: 'string',
    description: 'Filtrar por categoria de produtos'
  })
  @ApiResponse({
    status: 200,
    description: 'Estabelecimentos listados com sucesso'
  })
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async listarEstabelecimentos(@Query() filtros: any) {
    return this.estabelecimentoService.buscarEstabelecimentosPorFiltros(filtros);
  }

  /**
   * ✅ REST: GET /catalog/establishments/:id - Obter estabelecimento
   */
  @Get('establishments/:id')
  @Public()
  @ApiOperation({
    summary: 'Obter detalhes do estabelecimento',
    description: 'Obtém informações detalhadas de um estabelecimento específico'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do estabelecimento',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Detalhes do estabelecimento retornados com sucesso'
  })
  @ApiResponse({
    status: 404,
    description: 'Estabelecimento não encontrado'
  })
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async obterEstabelecimento(@Param('id') id: string) {
    return this.estabelecimentoService.obterDetalhesLoja(id);
  }

  /**
   * ✅ REST: GET /catalog/establishments/:id/products - Produtos do estabelecimento
   */
  @Get('establishments/:id/products')
  @Public()
  @ApiOperation({
    summary: 'Listar produtos do estabelecimento',
    description: 'Lista todos os produtos disponíveis de um estabelecimento específico'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do estabelecimento',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de produtos do estabelecimento retornada com sucesso'
  })
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async listarProdutos(@Param('id') estabelecimentoId: string) {
    return this.salesService.listarProdutosDeLoja(estabelecimentoId);
  }

  // ===== PRODUCTS =====

  /**
   * ✅ REST: GET /catalog/products/:id - Obter produto específico
   */
  @Get('products/:id')
  @Public()
  @ApiOperation({
    summary: 'Obter detalhes de produto',
    description: 'Obtém informações detalhadas de um produto específico'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do produto',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Detalhes do produto retornados com sucesso'
  })
  @ApiResponse({
    status: 404,
    description: 'Produto não encontrado'
  })
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async obterProduto(@Param('id') id: string) {
    return this.salesService.obterDetalhesProduto(id);
  }

  /**
   * ✅ REST: GET /catalog/products - Buscar produtos com filtros
   */
  @Get('products')
  @Public()
  @ApiOperation({
    summary: 'Buscar produtos',
    description: 'Busca produtos com filtros para o público geral'
  })
  @ApiQuery({
    name: 'nome',
    required: false,
    type: 'string',
    description: 'Nome do produto para busca'
  })
  @ApiQuery({
    name: 'categoria',
    required: false,
    type: 'string',
    description: 'Categoria do produto'
  })
  @ApiQuery({
    name: 'estabelecimento',
    required: false,
    type: 'string',
    description: 'Nome do estabelecimento'
  })
  @ApiResponse({
    status: 200,
    description: 'Produtos encontrados com sucesso'
  })
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async buscarProdutos(@Query() filtros: any) {
    return this.salesService.buscarProdutosPublico(filtros);
  }

  // ===== CATEGORIES =====

  /**
   * ✅ REST: GET /catalog/categories - Listar categorias
   */
  @Get('categories')
  @Public()
  @ApiOperation({
    summary: 'Listar categorias públicas',
    description: 'Lista todas as categorias disponíveis para o público'
  })
  @ApiResponse({
    status: 200,
    description: 'Categorias listadas com sucesso'
  })
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async listarCategorias() {
    return this.salesService.listarCategoriasPublico();
  }

  /**
   * ✅ REST: GET /catalog/categories/:id - Obter categoria específica
   */
  @Get('categories/:id')
  @Public()
  @ApiOperation({
    summary: 'Obter categoria específica',
    description: 'Obtém detalhes de uma categoria específica'
  })
  @ApiParam({
    name: 'id',
    description: 'ID da categoria',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Categoria encontrada com sucesso'
  })
  @ApiResponse({
    status: 404,
    description: 'Categoria não encontrada'
  })
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async obterCategoria(@Param('id') id: string) {
    return this.categoriaService.obterCategoriaPorId(id);
  }
}
