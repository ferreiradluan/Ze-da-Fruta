import { Controller, Get, UseGuards, Req, Param, Query, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../1-account-management/application/strategies/guards/jwt-auth.guard';
import { RolesGuard } from '../../../1-account-management/application/strategies/guards/roles.guard';
import { Roles } from '../../../1-account-management/application/strategies/guards/roles.decorator';
import { RoleType } from '../../../1-account-management/domain/enums/role-type.enum';
import { Public } from '../../../common/decorators/public.decorator';
import { SalesService } from '../../application/services/sales.service';
import { ListarProdutosDto } from '../dto/listar-produtos.dto';

@Controller('sales/lojas')
export class LojasController {
  constructor(private readonly salesService: SalesService) {}

  // ===== ENDPOINTS PÚBLICOS =====
  @Get()
  @Public()
  @ApiTags('🛍️ Catálogo Público')
  @ApiOperation({
    summary: 'Listar todas as lojas',
    description: 'Retorna lista de todas as lojas/estabelecimentos ativos. Endpoint público sem necessidade de autenticação. Rate limit: 100 req/min.'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de lojas retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        value: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'uuid-da-loja' },
              nome: { type: 'string', example: 'Hortifruti Central' },
              cnpj: { type: 'string', example: '12.345.678/0001-90' },
              endereco: { type: 'string', example: 'Rua das Flores, 123 - Centro' },
              telefone: { type: 'string', example: '(11) 99999-1111' },
              email: { type: 'string', example: 'contato@hortifruti.com' },
              ativo: { type: 'boolean', example: true },
              estaAberto: { type: 'boolean', example: true },
              descricao: { type: 'string', example: 'Estabelecimento tradicional' },
              latitude: { type: 'number', example: -23.5505 },
              longitude: { type: 'number', example: -46.6333 }
            }
          }
        },
        Count: { type: 'number', example: 3 }
      }
    }
  })
  async findAll() {
    return this.salesService.listarLojas();
  }

  @Get(':id')
  @Public()
  @ApiTags('🛍️ Catálogo Público')
  @ApiOperation({
    summary: 'Detalhes de uma loja',
    description: 'Retorna informações detalhadas de uma loja específica.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID da loja',
    example: 'uuid-da-loja'
  })
  @ApiResponse({
    status: 200,
    description: 'Detalhes da loja',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid-da-loja' },
        nome: { type: 'string', example: 'Hortifruti Central' },
        cnpj: { type: 'string', example: '12.345.678/0001-90' },
        endereco: { type: 'string', example: 'Rua das Flores, 123 - Centro' },
        telefone: { type: 'string', example: '(11) 99999-1111' },
        email: { type: 'string', example: 'contato@hortifruti.com' },
        ativo: { type: 'boolean', example: true },
        estaAberto: { type: 'boolean', example: true },
        descricao: { type: 'string', example: 'Estabelecimento tradicional no centro da cidade' },
        latitude: { type: 'number', example: -23.5505 },
        longitude: { type: 'number', example: -46.6333 }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Loja não encontrada'
  })
  async findOne(@Param('id') id: string) {
    return this.salesService.obterDetalhesLoja(id);
  }

  @Get(':id/produtos')
  @Public()
  @ApiTags('🛍️ Catálogo Público')
  @ApiOperation({
    summary: 'Produtos de uma loja',
    description: 'Lista todos os produtos disponíveis em uma loja específica.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID da loja',
    example: 'uuid-da-loja'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de produtos da loja',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'uuid-do-produto' },
          nome: { type: 'string', example: 'Alface Crespa' },
          preco: { type: 'number', example: 1.99 },
          descricao: { type: 'string', example: 'Alface fresca e crocante' },
          ativo: { type: 'boolean', example: true },
          disponivel: { type: 'boolean', example: true },
          estoque: { type: 'number', example: 50 },
          unidadeMedida: { type: 'string', example: 'unidade' },
          categorias: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                nome: { type: 'string', example: 'Verduras' }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Loja não encontrada'
  })
  async findProductsByStore(@Param('id') id: string) {
    return this.salesService.listarProdutosDeLoja(id);
  }

  @Get(':id/produtos/completo')
  @Public()
  @ApiTags('🛍️ Catálogo Público')
  @ApiOperation({
    summary: 'Produtos da loja com filtros avançados',
    description: 'Lista produtos de uma loja com opções de filtro e paginação.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID da loja',
    example: 'uuid-da-loja'
  })
  @ApiQuery({ type: ListarProdutosDto })
  @ApiResponse({
    status: 200,
    description: 'Lista filtrada de produtos da loja'
  })
  async produtosDaLojaCompleto(@Param('id') estabelecimentoId: string, @Query(ValidationPipe) filtros: ListarProdutosDto) {
    const filtrosComLoja = { ...filtros, estabelecimento: estabelecimentoId };
    return this.salesService.buscarProdutosPublico(filtrosComLoja);
  }

  // ===== ENDPOINTS PROTEGIDOS =====

  @Get('minhas-lojas')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.PARTNER)
  @ApiTags('🏪 Parceiro - Estabelecimentos')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Minhas lojas (Parceiro)',
    description: 'Lista estabelecimentos do parceiro logado. Apenas parceiros têm acesso.'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de estabelecimentos do parceiro',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', example: 'uuid-do-parceiro' },
        estabelecimentos: {
          type: 'array',
          items: { type: 'object' }
        },
        message: { 
          type: 'string', 
          example: 'Funcionalidade em desenvolvimento - implementar busca de estabelecimentos por parceiro'
        }
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - apenas parceiros'
  })
  listarMinhasLojas(@Req() req) {
    // TODO: Implementar lógica para buscar estabelecimentos do parceiro
    // Por enquanto retorna mock para demonstrar estrutura
    return { 
      userId: req.user.id, 
      estabelecimentos: [],
      message: 'Funcionalidade em desenvolvimento - implementar busca de estabelecimentos por parceiro'
    };
  }

  @Get('admin/todas')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiTags('👑 Admin - Estabelecimentos')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Todas as lojas (Admin)',
    description: 'Lista todos os estabelecimentos para administração. Apenas administradores têm acesso.'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista completa de estabelecimentos'
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - apenas administradores'
  })
  async listarTodasLojas(@Req() req) {
    // Admin pode ver todas as lojas
    return this.salesService.listarEstabelecimentosPublico();
  }
}
