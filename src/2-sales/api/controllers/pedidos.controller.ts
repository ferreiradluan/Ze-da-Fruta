import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../1-account-management/application/strategies/guards/jwt-auth.guard';
import { RolesGuard } from '../../../1-account-management/application/strategies/guards/roles.guard';
import { Roles } from '../../../1-account-management/application/strategies/guards/roles.decorator';
import { RoleType } from '../../../1-account-management/domain/enums/role-type.enum';
import { SalesService } from '../../application/services/sales.service';
import { CreatePedidoDto } from '../dto/create-pedido.dto';
import { UpdatePedidoDto, AdicionarItemDto, AplicarCupomDto } from '../dto/update-pedido.dto';
import { StatusPedido } from '../../domain/enums/status-pedido.enum';

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
    description: 'Cria um novo pedido com os itens especificados e retorna a URL para pagamento'
  })
  @ApiResponse({
    status: 201,
    description: 'Pedido criado com sucesso - retorna URL de checkout',
    schema: {
      properties: {
        checkoutUrl: {
          type: 'string',
          example: 'https://checkout.stripe.com/pay/cs_test_...'
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou estoque insuficiente'
  })
  async criarPedido(@Req() req, @Body() createPedidoDto: CreatePedidoDto) {
    return this.salesService.criarPedido(req.user.id, createPedidoDto);
  }

  @Get()
  @Roles(RoleType.USER, RoleType.PARTNER, RoleType.ADMIN)
  @ApiOperation({
    summary: 'Listar pedidos',
    description: 'Lista todos os pedidos do usuário (ou todos se for admin)'
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: StatusPedido,
    description: 'Filtrar por status do pedido'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de pedidos retornada com sucesso'
  })
  async listarPedidos(@Req() req, @Query('status') status?: StatusPedido) {
    return this.salesService.listarPedidos(req.user, status);
  }

  @Get(':id')
  @Roles(RoleType.USER, RoleType.PARTNER, RoleType.ADMIN)
  @ApiOperation({
    summary: 'Buscar pedido por ID',
    description: 'Retorna os detalhes de um pedido específico'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do pedido',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Pedido encontrado'
  })
  @ApiResponse({
    status: 404,
    description: 'Pedido não encontrado'
  })
  async buscarPedido(@Req() req, @Param('id') id: string) {
    const usuarioId = req.user.roles.includes('ADMIN') ? undefined : req.user.id;
    return this.salesService.buscarPedidoPorId(id, usuarioId);
  }

  @Patch(':id/status')
  @Roles(RoleType.USER, RoleType.PARTNER, RoleType.ADMIN)
  @ApiOperation({
    summary: 'Atualizar status do pedido',
    description: 'Atualiza o status de um pedido'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do pedido',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Status do pedido atualizado'
  })
  async atualizarStatus(@Req() req, @Param('id') id: string, @Body() updateDto: UpdatePedidoDto) {
    if (!updateDto.status) {
      throw new Error('Status é obrigatório');
    }
    return this.salesService.atualizarStatusPedido(req.user, id, updateDto.status);
  }

  @Post(':id/itens')
  @Roles(RoleType.USER)
  @ApiOperation({
    summary: 'Adicionar item ao pedido',
    description: 'Adiciona um novo item ao pedido'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do pedido',
    type: 'string'
  })
  @ApiResponse({
    status: 201,
    description: 'Item adicionado ao pedido'
  })
  async adicionarItem(@Req() req, @Param('id') id: string, @Body() adicionarItemDto: AdicionarItemDto) {
    const usuarioId = req.user.id;
    return this.salesService.adicionarItemAoPedido(id, {
      produtoId: adicionarItemDto.produtoId,
      quantidade: adicionarItemDto.quantidade
    });
  }

  @Delete(':id/itens/:itemId')
  @Roles(RoleType.USER)
  @ApiOperation({
    summary: 'Remover item do pedido',
    description: 'Remove um item específico do pedido'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do pedido',
    type: 'string'
  })
  @ApiParam({
    name: 'itemId',
    description: 'ID do item',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Item removido do pedido'
  })
  async removerItem(@Req() req, @Param('id') id: string, @Param('itemId') itemId: string) {
    return this.salesService.removerItemDoPedido(id, itemId, req.user.id);
  }

  @Patch(':id/itens/:itemId')
  @Roles(RoleType.USER)
  @ApiOperation({
    summary: 'Atualizar quantidade do item',
    description: 'Atualiza a quantidade de um item no pedido'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do pedido',
    type: 'string'
  })
  @ApiParam({
    name: 'itemId',
    description: 'ID do item',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Quantidade do item atualizada'
  })
  async atualizarQuantidade(
    @Req() req,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() body: { quantidade: number }
  ) {
    return this.salesService.atualizarQuantidadeItem(id, itemId, body.quantidade, req.user.id);
  }

  @Post(':id/cupom')
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
  @ApiResponse({
    status: 200,
    description: 'Cupom aplicado com sucesso'
  })
  async aplicarCupom(@Req() req, @Param('id') id: string, @Body() aplicarCupomDto: AplicarCupomDto) {
    return this.salesService.aplicarCupom(id, aplicarCupomDto.codigo, req.user.id);
  }

  @Delete(':id/cupom')
  @Roles(RoleType.USER)
  @ApiOperation({
    summary: 'Remover cupom do pedido',
    description: 'Remove o cupom de desconto aplicado ao pedido'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do pedido',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Cupom removido com sucesso'
  })
  async removerCupom(@Req() req, @Param('id') id: string) {
    return this.salesService.removerCupom(id, req.user.id);
  }

  @Patch(':id/cancelar')
  @Roles(RoleType.USER, RoleType.ADMIN)
  @ApiOperation({
    summary: 'Cancelar pedido',
    description: 'Cancela um pedido'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do pedido',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Pedido cancelado com sucesso'
  })
  async cancelarPedido(@Req() req, @Param('id') id: string) {
    const usuarioId = req.user.roles.includes('ADMIN') ? undefined : req.user.id;
    return this.salesService.cancelarPedido(id, usuarioId);
  }

  @Post(':id/validar-cupom')
  @Roles(RoleType.USER)
  @ApiOperation({
    summary: 'Validar cupom',
    description: 'Valida se um cupom pode ser aplicado ao pedido'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do pedido',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Resultado da validação do cupom'
  })
  async validarCupom(
    @Req() req,
    @Param('id') id: string,
    @Body() body: { codigo: string }
  ) {
    const pedido = await this.salesService.buscarPedidoPorId(id, req.user.id);
    return this.salesService.validarCupom(body.codigo, pedido.valorSubtotal);
  }
}
