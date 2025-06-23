import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { SalesService } from '../../application/services/sales.service';

/**
 * 🏪 CONTROLLER PÚBLICO PARA ESTABELECIMENTOS
 * 
 * ✅ Endpoints públicos para listar estabelecimentos
 * ✅ Não requer autenticação
 * ✅ Implementa os endpoints que estavam faltando nos testes
 */
@ApiTags('🏪 Public Establishments')
@Controller('establishments')
export class EstablishmentsPublicController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Listar estabelecimentos públicos',
    description: 'Lista todos os estabelecimentos disponíveis publicamente'
  })
  @ApiQuery({
    name: 'ativo',
    required: false,
    type: 'boolean',
    description: 'Filtrar por estabelecimentos ativos'
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: 'string',
    description: 'Buscar por nome do estabelecimento'
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
          ativo: { type: 'boolean' },
          imagemUrl: { type: 'string' }
        }
      }
    }
  })
  async listarEstabelecimentos(
    @Query('ativo') ativo?: boolean,
    @Query('search') search?: string
  ) {
    const filtros = { ativo, search };
    return this.salesService.buscarEstabelecimentosPublico(filtros);
  }

  @Get(':id')
  @Public()
  @ApiOperation({
    summary: 'Obter estabelecimento por ID',
    description: 'Obtém detalhes de um estabelecimento específico'
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
  async obterEstabelecimento(@Param('id') id: string) {
    return this.salesService.obterDetalhesEstabelecimento(id);
  }
}
