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
  ValidationPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../1-account-management/application/strategies/guards/jwt-auth.guard';
import { RolesGuard } from '../../../1-account-management/application/strategies/guards/roles.guard';
import { Roles } from '../../../1-account-management/application/strategies/guards/roles.decorator';
import { RoleType } from '../../../1-account-management/domain/enums/role-type.enum';
import { SalesService } from '../../application/services/sales.service';
import { CategoriaService } from '../../application/services/categoria.service';
import { CreateCategoriaDto } from '../dto/create-categoria.dto';

@ApiTags('👑 Admin - Categorias')
@Controller('categorias')
export class CategoriasController {
  constructor(private readonly categoriaService: CategoriaService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Listar todas as categorias',
    description: 'Lista todas as categorias para administração. Apenas admins têm acesso.'
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
          ativo: { type: 'boolean', example: true },
          criadoEm: { type: 'string', format: 'date-time' },
          atualizadoEm: { type: 'string', format: 'date-time' }
        }
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - apenas administradores'
  })
  async listarCategorias() {
    return this.categoriaService.listarCategorias();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Criar nova categoria',
    description: 'Cria uma nova categoria de produtos. Apenas administradores podem criar categorias.'
  })
  @ApiBody({ type: CreateCategoriaDto })
  @ApiResponse({
    status: 201,
    description: 'Categoria criada com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid-da-categoria' },
        nome: { type: 'string', example: 'Bebidas' },
        descricao: { type: 'string', example: 'Bebidas variadas' },
        ativo: { type: 'boolean', example: true },
        criadoEm: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou categoria já existe'
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - apenas administradores'
  })
  async criarCategoria(@Req() req, @Body(ValidationPipe) createCategoriaDto: CreateCategoriaDto) {
    return this.categoriaService.criarCategoria(req.user, createCategoriaDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Atualizar categoria',
    description: 'Atualiza uma categoria existente. Apenas administradores podem atualizar categorias.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID da categoria a ser atualizada',
    example: 'uuid-da-categoria'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nome: { type: 'string', example: 'Bebidas Premium' },
        descricao: { type: 'string', example: 'Bebidas selecionadas e premium' },
        ativo: { type: 'boolean', example: true }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Categoria atualizada com sucesso'
  })
  @ApiResponse({
    status: 404,
    description: 'Categoria não encontrada'
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - apenas administradores'
  })
  async atualizarCategoria(
    @Req() req, 
    @Param('id') id: string, 
    @Body(ValidationPipe) updateData: Partial<CreateCategoriaDto>
  ) {
    return this.categoriaService.atualizarCategoria(req.user, id, updateData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Excluir categoria',
    description: 'Exclui uma categoria. Apenas administradores podem excluir categorias.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID da categoria a ser excluída',
    example: 'uuid-da-categoria'
  })
  @ApiResponse({
    status: 200,
    description: 'Categoria excluída com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Categoria excluída com sucesso' }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Categoria não encontrada'
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - apenas administradores'
  })
  @ApiResponse({
    status: 400,
    description: 'Categoria não pode ser excluída - possui produtos associados'
  })
  async excluirCategoria(@Req() req, @Param('id') id: string) {
    await this.categoriaService.excluirCategoria(req.user, id);
    return { message: 'Categoria excluída com sucesso' };
  }
}
