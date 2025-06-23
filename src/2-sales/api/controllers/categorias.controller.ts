import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Param, 
  Body, 
  UseGuards,
  Req 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../../common/decorators/public.decorator';
import { Roles } from '../../../1-account-management/application/strategies/guards/roles.decorator';
import { ROLE } from '../../../1-account-management/domain/types/role.types';
import { JwtAuthGuard } from '../../../1-account-management/application/strategies/guards/jwt-auth.guard';
import { RolesGuard } from '../../../1-account-management/application/strategies/guards/roles.guard';
import { CategoriaService } from '../../application/services/categoria.service';

@Controller('sales/categorias')
export class CategoriasController {
  constructor(private readonly categoriaService: CategoriaService) {}
  // ========== ENDPOINTS ADMINISTRATIVOS ==========
  // Os endpoints públicos foram movidos para PublicCatalogController (/catalog/categories)
  
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN, ROLE.SELLER)
  @ApiBearerAuth()
  @ApiTags('🔧 Admin - Categorias')
  @ApiOperation({
    summary: 'Listar todas as categorias (Admin)',
    description: 'Lista todas as categorias com informações administrativas'
  })
  @ApiResponse({
    status: 200,
    description: 'Categorias listadas com sucesso'
  })  async listarTodasCategorias() {
    return this.categoriaService.listarCategorias();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN, ROLE.SELLER)
  @ApiBearerAuth()
  @ApiTags('🔧 Admin - Categorias')
  @ApiOperation({
    summary: 'Obter categoria por ID (Admin)',
    description: 'Obtém detalhes completos de uma categoria'
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
  async obterCategoriaPorId(@Param('id') id: string) {
    return this.categoriaService.obterCategoriaPorId(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  @ApiBearerAuth()
  @ApiTags('🔧 Admin - Categorias')
  @ApiOperation({
    summary: 'Criar nova categoria',
    description: 'Cria uma nova categoria no sistema'
  })
  @ApiResponse({
    status: 201,
    description: 'Categoria criada com sucesso'
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos'
  })  async criarCategoria(@Req() req: any, @Body() dadosCategoria: any) {
    return this.categoriaService.criarCategoria(dadosCategoria);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  @ApiBearerAuth()
  @ApiTags('🔧 Admin - Categorias')
  @ApiOperation({
    summary: 'Atualizar categoria',
    description: 'Atualiza uma categoria existente'
  })
  @ApiParam({
    name: 'id',
    description: 'ID da categoria',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Categoria atualizada com sucesso'
  })
  @ApiResponse({
    status: 404,
    description: 'Categoria não encontrada'
  })
  async atualizarCategoria(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dadosAtualizacao: any
  ) {
    return this.categoriaService.atualizarCategoria(req.user, id, dadosAtualizacao);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  @ApiBearerAuth()
  @ApiTags('🔧 Admin - Categorias')
  @ApiOperation({
    summary: 'Excluir categoria',
    description: 'Remove uma categoria do sistema (desativar)'
  })
  @ApiParam({
    name: 'id',
    description: 'ID da categoria',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Categoria excluída com sucesso'
  })
  @ApiResponse({
    status: 404,
    description: 'Categoria não encontrada'
  })
  async excluirCategoria(@Req() req: any, @Param('id') id: string) {
    return this.categoriaService.excluirCategoria(req.user, id);
  }
}
