import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  UseGuards, 
  Req, 
  Body, 
  Param, 
  Query,
  ValidationPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam, ApiQuery, ApiSecurity } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../1-account-management/application/strategies/guards/jwt-auth.guard';
import { RolesGuard } from '../../../1-account-management/application/strategies/guards/roles.guard';
import { Roles } from '../../../1-account-management/application/strategies/guards/roles.decorator';
import { RoleType } from '../../../1-account-management/domain/enums/role-type.enum';
import { Public } from '../../../common/decorators/public.decorator';
import { SalesService } from '../../application/services/sales.service';
import { CreateProdutoDto } from '../dto/create-produto.dto';
import { UpdateProdutoDto } from '../dto/update-produto.dto';
import { ListarProdutosDto } from '../dto/listar-produtos.dto';

@Controller('produtos')
export class ProdutosController {
  constructor(private readonly salesService: SalesService) {}

  // ===== ENDPOINTS PÚBLICOS (sem autenticação) =====  @Get('catalogo')
  @Public()
  @ApiTags('🛍️ Catálogo Público')
  @ApiOperation({
    summary: 'Listar produtos no catálogo público',
    description: 'Endpoint público para listar produtos com filtros e paginação. Rate limit: 100 req/min.'
  })
  @ApiQuery({ type: ListarProdutosDto })
  @ApiResponse({
    status: 200,
    description: 'Lista de produtos retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        produtos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'uuid-do-produto' },
              nome: { type: 'string', example: 'Banana Prata' },
              preco: { type: 'number', example: 2.99 },
              descricao: { type: 'string', example: 'Banana doce e nutritiva' },
              imagemUrl: { type: 'string', example: '/uploads/product/banana.png' },
              estoque: { type: 'number', example: 100 },
              unidadeMedida: { type: 'string', example: 'kg' },
              categoria: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  nome: { type: 'string', example: 'Frutas' }
                }
              },
              estabelecimento: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  nome: { type: 'string', example: 'Hortifruti Central' }
                }
              }
            }
          }
        },
        total: { type: 'number', example: 50 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 20 },
        totalPages: { type: 'number', example: 3 }
      }
    }
  })
  async catalogoPublico(@Query(ValidationPipe) filtros: ListarProdutosDto) {
    return this.salesService.buscarProdutosPublico(filtros);
  }
  @Get('categorias')
  @Public()
  @ApiTags('🛍️ Catálogo Público')
  @ApiOperation({
    summary: 'Listar categorias públicas',
    description: 'Retorna lista de todas as categorias ativas para consulta pública. Rate limit: 100 req/min.'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de categorias',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'uuid-da-categoria' },
          nome: { type: 'string', example: 'Frutas' },
          descricao: { type: 'string', example: 'Frutas frescas e saborosas' },
          ativo: { type: 'boolean', example: true }
        }
      }
    }
  })
  async categoriasPublico() {
    return this.salesService.listarCategoriasPublico();
  }
  @Get('estabelecimentos')
  @Public()
  @ApiTags('🛍️ Catálogo Público')
  @ApiOperation({
    summary: 'Listar estabelecimentos públicos',
    description: 'Retorna lista de todos os estabelecimentos ativos para consulta pública. Rate limit: 100 req/min.'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de estabelecimentos',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'uuid-do-estabelecimento' },
          nome: { type: 'string', example: 'Hortifruti Central' },
          endereco: { type: 'string', example: 'Rua das Flores, 123' },
          telefone: { type: 'string', example: '(11) 99999-1111' },
          latitude: { type: 'number', example: -23.5505 },
          longitude: { type: 'number', example: -46.6333 }
        }
      }
    }
  })
  async estabelecimentosPublico() {
    return this.salesService.listarEstabelecimentosPublico();
  }
  @Get('catalogo/:id')
  @Public()
  @ApiTags('🛍️ Catálogo Público')
  @ApiOperation({
    summary: 'Detalhes de produto público',
    description: 'Retorna detalhes completos de um produto específico. Rate limit: 100 req/min.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do produto',
    example: 'uuid-do-produto'
  })
  @ApiResponse({
    status: 200,
    description: 'Detalhes do produto',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid-do-produto' },
        nome: { type: 'string', example: 'Banana Prata' },
        preco: { type: 'number', example: 2.99 },
        descricao: { type: 'string', example: 'Banana doce e nutritiva' },
        estoque: { type: 'number', example: 100 },
        unidadeMedida: { type: 'string', example: 'kg' }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Produto não encontrado'
  })
  async detalhesProdutoPublico(@Param('id') id: string) {
    return this.salesService.buscarProdutoPorId(id);
  }

  // ===== ENDPOINTS PROTEGIDOS (requer autenticação) =====

  @Get('gerenciar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.PARTNER)
  @ApiTags('🏪 Parceiro - Produtos')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Listar produtos para gerenciamento',
    description: 'Lista produtos que o usuário pode gerenciar. Admins veem todos, parceiros veem apenas os seus.'
  })
  @ApiQuery({ type: ListarProdutosDto })
  @ApiResponse({
    status: 200,
    description: 'Lista de produtos para gerenciamento'
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - apenas admins e parceiros'
  })
  async listarProdutosPorPerfil(@Req() req, @Query(ValidationPipe) filtros?: ListarProdutosDto) {
    if (!req.user || !req.user.id || !req.user.roles) {
      throw new Error('Usuário não autenticado ou sem perfil');
    }
    return this.salesService.listarProdutosPorPerfil(req.user, filtros);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.PARTNER)
  @ApiTags('🏪 Parceiro - Produtos')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Criar novo produto',
    description: 'Cria um novo produto. Parceiros só podem criar produtos para seus estabelecimentos.'
  })
  @ApiBody({ type: CreateProdutoDto })
  @ApiResponse({
    status: 201,
    description: 'Produto criado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid-do-produto' },
        nome: { type: 'string', example: 'Banana Prata' },
        preco: { type: 'number', example: 2.99 },
        criadoEm: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos'
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - apenas admins e parceiros'
  })
  async criarProduto(@Req() req, @Body(ValidationPipe) createProdutoDto: CreateProdutoDto) {
    return this.salesService.criarProduto(req.user, createProdutoDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.PARTNER)
  @ApiTags('🏪 Parceiro - Produtos')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Atualizar produto',
    description: 'Atualiza um produto existente. Parceiros só podem atualizar seus próprios produtos.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do produto a ser atualizado',
    example: 'uuid-do-produto'
  })
  @ApiBody({ type: UpdateProdutoDto })
  @ApiResponse({
    status: 200,
    description: 'Produto atualizado com sucesso'
  })
  @ApiResponse({
    status: 403,
    description: 'Não autorizado para atualizar este produto'
  })
  @ApiResponse({
    status: 404,
    description: 'Produto não encontrado'
  })
  async atualizarProduto(
    @Req() req, 
    @Param('id') id: string, 
    @Body(ValidationPipe) updateProdutoDto: UpdateProdutoDto
  ) {
    return this.salesService.atualizarProduto(req.user, id, updateProdutoDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.PARTNER)
  @ApiTags('🏪 Parceiro - Produtos')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Excluir produto',
    description: 'Exclui um produto. Parceiros só podem excluir seus próprios produtos.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do produto a ser excluído',
    example: 'uuid-do-produto'
  })
  @ApiResponse({
    status: 200,
    description: 'Produto excluído com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Produto excluído com sucesso' }
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: 'Não autorizado para excluir este produto'
  })
  @ApiResponse({
    status: 404,
    description: 'Produto não encontrado'
  })
  async excluirProduto(@Req() req, @Param('id') id: string) {
    await this.salesService.excluirProduto(req.user, id);
    return { message: 'Produto excluído com sucesso' };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.PARTNER)
  @ApiTags('🏪 Parceiro - Produtos')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Detalhes do produto para gerenciamento',
    description: 'Retorna detalhes completos de um produto para gerenciamento.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do produto',
    example: 'uuid-do-produto'
  })
  @ApiResponse({
    status: 200,
    description: 'Detalhes do produto'
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado ao produto'
  })
  @ApiResponse({
    status: 404,
    description: 'Produto não encontrado'
  })
  async detalhesProduto(@Req() req, @Param('id') id: string) {
    return this.salesService.buscarProdutoPorId(id);
  }
}
