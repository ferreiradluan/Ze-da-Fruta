import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { SalesService } from '../../application/services/sales.service';

/**
 * 🛍️ CONTROLLER PÚBLICO PARA PRODUTOS
 * 
 * ✅ Endpoints públicos para listar produtos
 * ✅ Não requer autenticação
 * ✅ Implementa os endpoints que estavam faltando nos testes
 */
@ApiTags('🛍️ Public Products')
@Controller('products')
export class ProductsPublicController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Listar produtos públicos',
    description: 'Lista todos os produtos disponíveis publicamente'
  })
  @ApiQuery({
    name: 'categoria',
    required: false,
    type: 'string',
    description: 'Filtrar por categoria'
  })
  @ApiQuery({
    name: 'estabelecimento',
    required: false,
    type: 'string',
    description: 'Filtrar por estabelecimento'
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: 'string',
    description: 'Buscar por nome do produto'
  })
  @ApiResponse({
    status: 200,
    description: 'Produtos listados com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          nome: { type: 'string' },
          preco: { type: 'number' },
          descricao: { type: 'string' },
          imagemUrl: { type: 'string' },
          categoria: { type: 'string' },
          estabelecimento: { type: 'string' },
          disponivel: { type: 'boolean' },
          estoque: { type: 'number' }
        }
      }
    }
  })
  async listarProdutos(
    @Query('categoria') categoria?: string,
    @Query('estabelecimento') estabelecimento?: string,
    @Query('search') search?: string
  ) {
    const filtros = {
      categoria,
      estabelecimento,
      search
    };
    
    return this.salesService.buscarProdutosPublico(filtros);
  }
  @Get('available')
  @Public()
  @ApiOperation({
    summary: 'Listar produtos disponíveis',
    description: 'Lista todos os produtos disponíveis no estoque'
  })
  @ApiResponse({
    status: 200,
    description: 'Produtos disponíveis listados com sucesso'
  })
  async listarProdutosDisponiveis() {
    return this.salesService.buscarProdutosDisponiveis();
  }

  @Get(':id')
  @Public()
  @ApiOperation({
    summary: 'Obter produto por ID',
    description: 'Obtém detalhes de um produto específico'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do produto',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Produto encontrado com sucesso'
  })
  @ApiResponse({
    status: 404,
    description: 'Produto não encontrado'
  })
  async obterProduto(@Param('id') id: string) {
    return this.salesService.obterDetalhesProduto(id);
  }

  @Get('category/:categoryId')
  @Public()
  @ApiOperation({
    summary: 'Listar produtos por categoria',
    description: 'Lista todos os produtos de uma categoria específica'
  })
  @ApiParam({
    name: 'categoryId',
    description: 'ID da categoria',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Produtos da categoria listados com sucesso'
  })
  async listarProdutosPorCategoria(@Param('categoryId') categoryId: string) {
    return this.salesService.buscarProdutosPorCategoria(categoryId);
  }
}
