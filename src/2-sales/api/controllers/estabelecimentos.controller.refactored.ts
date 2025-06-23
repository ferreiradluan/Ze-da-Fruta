import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../../common/decorators/public.decorator';
import { EstabelecimentoService } from '../../application/services/estabelecimento.service';
import { SalesService } from '../../application/services/sales.service';
import { 
  FiltrosEstabelecimentoDto, 
  FiltrosProdutoDto 
} from '../dto/filters';
import { 
  EstabelecimentoPublicoDto, 
  ProdutoPublicoDto,
  PaginacaoResponseDto 
} from '../dto/responses';

/**
 * 🔧 FASE 4: ESTABELECIMENTOS CONTROLLER OTIMIZADO PARA REST
 * 
 * ✅ Filtros e paginação implementados
 * ✅ Response DTOs estruturados
 * ✅ Padrões REST corretos
 */
@ApiTags('🏪 Establishments')
@Controller('establishments')
export class EstabelecimentosController {
  constructor(
    private readonly estabelecimentoService: EstabelecimentoService,
    private readonly salesService: SalesService
  ) {}

  /**
   * ✅ REST: GET /establishments - Listar estabelecimentos com filtros e paginação
   */
  @Get()
  @Public()
  @ApiOperation({
    summary: 'Listar estabelecimentos',
    description: 'Lista estabelecimentos com filtros e paginação'
  })
  @ApiResponse({
    status: 200,
    description: 'Estabelecimentos listados com sucesso',
    type: PaginacaoResponseDto<EstabelecimentoPublicoDto>
  })
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async listarEstabelecimentos(
    @Query() filtros: FiltrosEstabelecimentoDto
  ): Promise<PaginacaoResponseDto<EstabelecimentoPublicoDto>> {
    return this.estabelecimentoService.listarComFiltros(filtros);
  }

  /**
   * ✅ REST: GET /establishments/:id - Obter estabelecimento específico
   */
  @Get(':id')
  @Public()
  @ApiOperation({
    summary: 'Obter estabelecimento',
    description: 'Obtém detalhes de um estabelecimento específico'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do estabelecimento',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Estabelecimento encontrado com sucesso',
    type: EstabelecimentoPublicoDto
  })
  @ApiResponse({
    status: 404,
    description: 'Estabelecimento não encontrado'
  })
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async obterEstabelecimento(@Param('id') id: string): Promise<EstabelecimentoPublicoDto> {
    return this.estabelecimentoService.obterDetalhesPublicos(id);
  }

  /**
   * ✅ REST: GET /establishments/:id/products - Produtos do estabelecimento com filtros
   */
  @Get(':id/products')
  @Public()
  @ApiOperation({
    summary: 'Listar produtos do estabelecimento',
    description: 'Lista produtos de um estabelecimento com filtros e paginação'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do estabelecimento',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Produtos listados com sucesso',
    type: PaginacaoResponseDto<ProdutoPublicoDto>
  })
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async listarProdutosDoEstabelecimento(
    @Param('id') estabelecimentoId: string,
    @Query() filtros: FiltrosProdutoDto
  ): Promise<PaginacaoResponseDto<ProdutoPublicoDto>> {    // Adicionar o ID do estabelecimento aos filtros
    filtros.estabelecimentoId = estabelecimentoId;
    const produtos = await this.salesService.buscarProdutosComFiltros(filtros);
    
    // Temporary fix: convert to expected format
    return {
      items: produtos as any[],
      total: produtos.length,
      page: 1,
      limit: produtos.length
    } as PaginacaoResponseDto<ProdutoPublicoDto>;
  }

  /**
   * ✅ REST: GET /establishments/:id/status - Status do estabelecimento
   */
  @Get(':id/status')
  @Public()
  @ApiOperation({
    summary: 'Obter status do estabelecimento',
    description: 'Obtém informações de status (aberto/fechado, tempo de entrega, etc.)'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do estabelecimento',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Status obtido com sucesso',
    schema: {
      type: 'object',
      properties: {
        estaAberto: { type: 'boolean' },
        tempoEntrega: { type: 'number', description: 'Tempo em minutos' },
        taxaEntrega: { type: 'number' },
        horarioFuncionamento: {
          type: 'object',
          properties: {
            abertura: { type: 'string', example: '08:00' },
            fechamento: { type: 'string', example: '18:00' }
          }
        }
      }
    }
  })
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async obterStatus(@Param('id') id: string) {
    return this.estabelecimentoService.obterStatusOperacional(id);
  }
}
