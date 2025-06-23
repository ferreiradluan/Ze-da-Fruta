import { 
  Controller, 
  Get, 
  Param, 
  Query,
  UseGuards
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../../common/decorators/public.decorator';
import { Roles } from '../../../1-account-management/decorators/roles.decorator';
import { ROLE } from '../../../1-account-management/domain/types/role.types';
import { JwtAuthGuard } from '../../../1-account-management/guards/jwt-auth.guard';
import { RolesGuard } from '../../../1-account-management/guards/roles.guard';
import { EstabelecimentoService } from '../../application/services/estabelecimento.service';

@Controller('sales/estabelecimentos')
export class EstabelecimentosController {
  constructor(private readonly estabelecimentoService: EstabelecimentoService) {}

  // ========== ENDPOINTS PÚBLICOS ==========
  
  @Get('publico')
  @Public()
  @ApiTags('🛍️ Catálogo Público')
  @ApiOperation({
    summary: 'Listar estabelecimentos público',
    description: 'Lista todos os estabelecimentos/lojas disponíveis para o público'
  })
  @ApiResponse({
    status: 200,
    description: 'Estabelecimentos listados com sucesso'
  })
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async listarEstabelecimentosPublico() {
    return this.estabelecimentoService.listarEstabelecimentosPublico();
  }

  @Get('publico/buscar')
  @Public()
  @ApiTags('🛍️ Catálogo Público')
  @ApiOperation({
    summary: 'Buscar estabelecimentos',
    description: 'Busca estabelecimentos com filtros para o público'
  })
  @ApiQuery({
    name: 'nome',
    description: 'Nome do estabelecimento',
    required: false,
    type: 'string'
  })
  @ApiQuery({
    name: 'categoria',
    description: 'Categoria dos produtos',
    required: false,
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Estabelecimentos encontrados com sucesso'
  })
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async buscarEstabelecimentosPublico(@Query() filtros: any) {
    return this.estabelecimentoService.buscarEstabelecimentosPorFiltros(filtros);
  }

  @Get('publico/:id')
  @Public()
  @ApiTags('🛍️ Catálogo Público')
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
  async obterDetalhesEstabelecimento(@Param('id') id: string) {
    return this.estabelecimentoService.obterDetalhesLoja(id);
  }

  @Get('publico/:id/produtos')
  @Public()
  @ApiTags('🛍️ Catálogo Público')
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
    description: 'Produtos do estabelecimento listados com sucesso'
  })
  @ApiResponse({
    status: 404,
    description: 'Estabelecimento não encontrado'
  })
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async listarProdutosDoEstabelecimento(@Param('id') id: string) {
    return this.estabelecimentoService.obterEstabelecimentoComProdutos(id);
  }

  // ========== ENDPOINTS ADMINISTRATIVOS ==========

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN, ROLE.SELLER)
  @ApiBearerAuth()
  @ApiTags('🔧 Admin - Estabelecimentos')
  @ApiOperation({
    summary: 'Listar todos os estabelecimentos (Admin)',
    description: 'Lista todos os estabelecimentos com informações administrativas'
  })
  @ApiResponse({
    status: 200,
    description: 'Estabelecimentos listados com sucesso'
  })
  async listarTodosEstabelecimentos() {
    return this.estabelecimentoService.listarEstabelecimentosPublico(); // Pode ser expandido depois
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN, ROLE.SELLER)
  @ApiBearerAuth()
  @ApiTags('🔧 Admin - Estabelecimentos')
  @ApiOperation({
    summary: 'Obter estabelecimento por ID (Admin)',
    description: 'Obtém detalhes completos de um estabelecimento'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do estabelecimento',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Estabelecimento encontrado com sucesso'
  })
  @ApiResponse({
    status: 404,
    description: 'Estabelecimento não encontrado'
  })
  async obterEstabelecimentoPorId(@Param('id') id: string) {
    return this.estabelecimentoService.obterDetalhesLoja(id);
  }

  @Get(':id/produtos-completo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN, ROLE.SELLER)
  @ApiBearerAuth()
  @ApiTags('🔧 Admin - Estabelecimentos')
  @ApiOperation({
    summary: 'Obter estabelecimento com produtos (Admin)',
    description: 'Obtém estabelecimento com lista completa de produtos'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do estabelecimento',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Estabelecimento com produtos encontrado com sucesso'
  })
  @ApiResponse({
    status: 404,
    description: 'Estabelecimento não encontrado'
  })
  async obterEstabelecimentoComProdutos(@Param('id') id: string) {
    return this.estabelecimentoService.obterEstabelecimentoComProdutos(id);
  }
}
