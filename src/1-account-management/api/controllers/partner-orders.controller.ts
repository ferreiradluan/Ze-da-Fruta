import { Controller, Get, Patch, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../application/strategies/guards/jwt-auth.guard';
import { RolesGuard } from '../../application/strategies/guards/roles.guard';
import { Roles } from '../../application/strategies/guards/roles.decorator';
import { ROLE } from '../../domain/types/role.types';
import { SalesService } from '../../../2-sales/application/services/sales.service';
import { STATUS_PEDIDO, StatusPedido } from '../../../2-sales/domain/types/status-pedido.types';

@ApiTags('🏪 Parceiro - Pedidos')
@Controller('partner/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.SELLER, ROLE.ADMIN)
@ApiBearerAuth('JWT-auth')
export class PartnerOrdersController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar pedidos do parceiro',
    description: 'Lista todos os pedidos associados às lojas do parceiro autenticado. Permite filtros por status.'
  })  @ApiQuery({
    name: 'status',
    required: false,
    enum: Object.values(STATUS_PEDIDO),
    description: 'Filtrar por status do pedido'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de pedidos do parceiro retornada com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'uuid-do-pedido' },
          clienteId: { type: 'string', example: 'uuid-do-cliente' },
          status: { type: 'string', enum: Object.values(STATUS_PEDIDO) },
          valorTotal: { type: 'number', example: 45.90 },
          valorSubtotal: { type: 'number', example: 42.90 },
          valorFrete: { type: 'number', example: 3.00 },
          enderecoEntrega: { type: 'string', example: 'Rua das Flores, 123' },
          observacoes: { type: 'string', example: 'Entregar no portão' },
          createdAt: { type: 'string', format: 'date-time' },
          itens: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                produtoId: { type: 'string' },
                nomeProduto: { type: 'string' },
                quantidade: { type: 'number' },
                precoUnitario: { type: 'number' },
                subtotal: { type: 'number' }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - apenas parceiros'
  })  async listarPedidosDoParceiro(@Req() req, @Query('status') status?: StatusPedido) {
    const parceiroId = req.user.id;
    // TODO: Implementar método específico para parceiros
    // Por enquanto usando o método existente
    return this.salesService.listarPedidosPorEstabelecimento(parceiroId, status);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Atualizar status do pedido',
    description: 'Atualiza o status de um pedido específico. Apenas o parceiro responsável pode alterar o status dos seus pedidos.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do pedido',
    type: 'string'
  })
  @ApiBody({
    description: 'Novo status do pedido',
    schema: {
      type: 'object',
      properties: {
        status: { 
          type: 'string', 
          enum: Object.values(STATUS_PEDIDO),
          example: 'EM_PREPARACAO',
          description: 'Novo status do pedido'
        }
      },
      required: ['status']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Status do pedido atualizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid-do-pedido' },        status: { type: 'string', enum: Object.values(STATUS_PEDIDO) },
        statusAnterior: { type: 'string', enum: Object.values(STATUS_PEDIDO) },
        atualizadoEm: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Transição de status inválida'
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - pedido não pertence ao parceiro'
  })
  @ApiResponse({
    status: 404,
    description: 'Pedido não encontrado'
  })  async atualizarStatusPedidoParceiro(
    @Req() req,
    @Param('id') pedidoId: string,
    @Body() body: { status: StatusPedido }
  ) {
    const parceiroId = req.user.id;
    
    // Implementação temporária para testes - retorna sucesso simulado
    // TODO: Implementar validação de propriedade do pedido pelo parceiro
    // TODO: Implementar atualização real do status no banco de dados
    
    const statusAnterior = 'PENDENTE' as StatusPedido;
    const novoStatus = body.status;
    
    return {
      id: pedidoId,
      status: novoStatus,
      statusAnterior: statusAnterior,
      atualizadoEm: new Date().toISOString(),
      message: 'Status atualizado com sucesso (simulação)'
    };
  }
}
