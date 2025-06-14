import { 
  Controller, 
  Get, 
  Param,
  Query
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../../common/decorators/public.decorator';
import { SalesService } from '../../application/services/sales.service';

@Controller('produtos')
export class ProdutosController {
  constructor(private readonly salesService: SalesService) {}

  @Get('loja/:lojaId')
  @Public()
  @ApiTags('🛍️ Catálogo Público')
  @ApiOperation({
    summary: 'Listar produtos de uma loja',
    description: 'Lista todos os produtos disponíveis de uma loja específica'
  })
  @ApiParam({
    name: 'lojaId',
    description: 'ID da loja',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de produtos da loja retornada com sucesso'
  })
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async listarProdutosDeLoja(@Param('lojaId') lojaId: string) {
    return this.salesService.listarProdutosDeLoja(lojaId);
  }

  @Get(':id/detalhes')
  @Public()
  @ApiTags('🛍️ Catálogo Público')
  @ApiOperation({
    summary: 'Obter detalhes de um produto',
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
  })  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async obterDetalhesProduto(@Param('id') produtoId: string) {
    return this.salesService.obterDetalhesProduto(produtoId);
  }

  // Migrar endpoints de busca pública
  @Get('publico')
  @Public()
  @ApiTags('🛍️ Catálogo Público')
  @ApiOperation({
    summary: 'Buscar produtos público',
    description: 'Busca produtos com filtros para o público geral'
  })
  @ApiResponse({
    status: 200,
    description: 'Produtos encontrados com sucesso'
  })
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async buscarProdutosPublico(@Query() filtros: any) {
    return this.salesService.buscarProdutosPublico(filtros);
  }

  @Get('categorias')
  @Public()
  @ApiTags('🛍️ Catálogo Público')
  @ApiOperation({
    summary: 'Listar categorias público',
    description: 'Lista todas as categorias disponíveis para o público'
  })
  @ApiResponse({
    status: 200,
    description: 'Categorias listadas com sucesso'
  })
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async listarCategoriasPublico() {
    return this.salesService.listarCategoriasPublico();
  }
}
