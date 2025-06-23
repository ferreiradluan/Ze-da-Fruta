import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { CategoriaService } from '../../application/services/categoria.service';

/**
 * 🛍️ CONTROLLER PÚBLICO PARA CATEGORIAS
 * 
 * ✅ Endpoints públicos para listar categorias
 * ✅ Não requer autenticação
 * ✅ Implementa os endpoints que estavam faltando nos testes
 */
@ApiTags('🛍️ Public Categories')
@Controller('categories')
export class CategoriasPublicController {
  constructor(private readonly categoriaService: CategoriaService) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Listar categorias públicas',
    description: 'Lista todas as categorias disponíveis publicamente'
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
          ativo: { type: 'boolean' }
        }
      }
    }
  })
  async listarCategorias() {
    return this.categoriaService.listarCategoriasPublico();
  }

  @Get(':id')
  @Public()
  @ApiOperation({
    summary: 'Obter categoria por ID',
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
  async obterCategoria(@Param('id') id: string) {
    return this.categoriaService.obterCategoriaPorId(id);
  }
}
