import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { SalesService } from '../../application/services/sales.service';

/**
 * 🌐 CONTROLLER PARA ENDPOINTS PÚBLICOS DO SALES
 * 
 * ✅ Implementa os endpoints `/sales/public/*` que estavam faltando nos testes
 * ✅ Endpoints públicos específicos para o módulo de vendas
 * ✅ Não requer autenticação
 */

@ApiTags('🌐 Sales - Endpoints Públicos')
@Controller('sales/public')
export class SalesPublicController {
  constructor(private readonly salesService: SalesService) {}
  @Get('products')
  @Public()
  @ApiOperation({
    summary: 'Listar produtos públicos via Sales',
    description: 'Lista todos os produtos disponíveis publicamente através do módulo de vendas'
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
  })  async listarProdutosPublicos(
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
  }  @Get('categories')
  @Public()
  @ApiOperation({
    summary: 'Listar categorias públicas via Sales',
    description: 'Lista todas as categorias de produtos disponíveis publicamente'
  })
  @ApiResponse({
    status: 200,
    description: 'Categorias listadas com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          nome: { type: 'string' },
          descricao: { type: 'string' },
          ativo: { type: 'boolean' },
          produtosCount: { type: 'number' }
        }
      }
    }
  })  async listarCategoriasPublicas() {
    return this.salesService.listarCategoriasPublico();
  }
  @Get('establishments')
  @Public()
  @ApiOperation({
    summary: 'Listar estabelecimentos públicos via Sales',
    description: 'Lista todos os estabelecimentos ativos disponíveis publicamente'
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
    description: 'Estabelecimentos listados com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          nome: { type: 'string' },
          descricao: { type: 'string' },
          endereco: { type: 'string' },
          telefone: { type: 'string' },
          email: { type: 'string' },
          imagemUrl: { type: 'string' },
          estaAberto: { type: 'boolean' },
          categoria: { type: 'string' },
          avaliacaoMedia: { type: 'number' }
        }
      }
    }
  })  async listarEstabelecimentosPublicos(
    @Query('cidade') cidade?: string,
    @Query('categoria') categoria?: string
  ) {
    const filtros = {
      cidade,
      categoria
    };
    
    return this.salesService.listarEstabelecimentosPublico();
  }
}
