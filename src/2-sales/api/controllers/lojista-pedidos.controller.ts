import { Controller, Get, Patch, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../1-account-management/application/strategies/guards/jwt-auth.guard';
import { RolesGuard } from '../../../1-account-management/application/strategies/guards/roles.guard';
import { Roles } from '../../../1-account-management/application/strategies/guards/roles.decorator';
import { RoleType } from '../../../1-account-management/domain/enums/role-type.enum';
import { SalesService } from '../../application/services/sales.service';
import { StatusPedido } from '../../domain/enums/status-pedido.enum';

@ApiTags('🏪 Lojista - Pedidos')
@Controller('lojista/pedidos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.PARTNER)
@ApiBearerAuth('JWT-auth')
export class LojistaPedidosController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar pedidos da loja',
    description: 'Lista todos os pedidos associados às lojas do lojista autenticado. Permite filtros por status.'
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: StatusPedido,
    description: 'Filtrar por status do pedido'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de pedidos da loja retornada com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'uuid-do-pedido' },
          clienteId: { type: 'string', example: 'uuid-do-cliente' },
          status: { type: 'string', enum: Object.values(StatusPedido) },
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
    description: 'Acesso negado - apenas lojistas'
  })
  async listarPedidosDaLoja(@Req() req, @Query('status') status?: StatusPedido) {
    const lojistaId = req.user.id;
    return this.salesService.listarPedidosDaLoja(lojistaId, status);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Atualizar status do pedido',
    description: 'Atualiza o status de um pedido específico. Apenas o lojista responsável pode alterar o status dos seus pedidos.'
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
          enum: Object.values(StatusPedido),
          example: 'PREPARANDO',
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
        id: { type: 'string', example: 'uuid-do-pedido' },
        status: { type: 'string', enum: Object.values(StatusPedido) },
        statusAnterior: { type: 'string', enum: Object.values(StatusPedido) },
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
    description: 'Acesso negado - pedido não pertence ao lojista'
  })
  @ApiResponse({
    status: 404,
    description: 'Pedido não encontrado'
  })
  async atualizarStatusPedidoLojista(
    @Req() req,
    @Param('id') pedidoId: string,
    @Body() body: { status: StatusPedido }
  ) {
    const lojistaId = req.user.id;
    return this.salesService.atualizarStatusPedidoLojista(lojistaId, pedidoId, body.status);
  }
}
