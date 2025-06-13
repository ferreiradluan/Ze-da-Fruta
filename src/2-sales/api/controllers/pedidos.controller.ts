import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../1-account-management/application/strategies/guards/jwt-auth.guard';
import { RolesGuard } from '../../../1-account-management/application/strategies/guards/roles.guard';
import { Roles } from '../../../1-account-management/application/strategies/guards/roles.decorator';
import { RoleType } from '../../../1-account-management/domain/enums/role-type.enum';
import { SalesService } from '../../application/services/sales.service';

@ApiTags('👤 Cliente - Pedidos')
@Controller('pedidos')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class PedidosController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @Roles(RoleType.USER)
  @ApiOperation({
    summary: 'Criar novo pedido',
    description: 'Cria um novo pedido com os itens especificados seguindo o padrão DDD'
  })
  @ApiResponse({
    status: 201,
    description: 'Pedido criado com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou estoque insuficiente'
  })
  async criarPedido(@Req() req, @Body() dadosSacola: any) {
    return this.salesService.criarPedido(req.user.id, dadosSacola);
  }

  @Get(':id')
  @Roles(RoleType.USER)
  @ApiOperation({
    summary: 'Obter pedido específico',
    description: 'Obtém um pedido específico do cliente logado'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do pedido',
    type: 'string'
  })
  async obterPedido(@Req() req, @Param('id') pedidoId: string) {
    return this.salesService.obterPedido(pedidoId, req.user.id);
  }

  @Patch(':id/cupom')
  @Roles(RoleType.USER)
  @ApiOperation({
    summary: 'Aplicar cupom ao pedido',
    description: 'Aplica um cupom de desconto ao pedido'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do pedido',
    type: 'string'
  })
  async aplicarCupom(@Param('id') pedidoId: string, @Body() body: { codigoCupom: string }) {
    return this.salesService.aplicarCupomAoPedido(pedidoId, body.codigoCupom);
  }
}
