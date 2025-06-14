import { 
  Controller, 
  Get, 
  Post, 
  Put,
  Param, 
  Body, 
  UseGuards,
  Req 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../../1-account-management/decorators/roles.decorator';
import { Role3 } from '../../../1-account-management/enums/role.enum';
import { JwtAuthGuard } from '../../../1-account-management/guards/jwt-auth.guard';
import { RolesGuard } from '../../../1-account-management/guards/roles.guard';
import { SalesService } from '../../application/services/sales.service';
import { SacolaDto } from '../../domain/entities/pedido.entity';

/**
 * 🔧 FASE 4: SALESCONTROLLER OTIMIZADO PARA REST
 * 
 * ✅ APENAS Core Sales Domain
 * ✅ Padrões REST corretos
 * ✅ Endpoints focados no domínio de vendas
 */
@ApiTags('💰 Sales - Core Domain')
@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  // ===== CORE SALES OPERATIONS =====

  /**
   * ✅ REST: POST /sales/cart/checkout - Criar pedido do carrinho
   */
  @Post('cart/checkout')
  @Roles(Role3.USER)
  @ApiOperation({
    summary: 'Checkout do carrinho',
    description: 'Converte o carrinho em um pedido confirmado'
  })
  @ApiResponse({
    status: 201,
    description: 'Pedido criado com sucesso'
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou estoque insuficiente'
  })
  async criarPedido(@Req() req, @Body() sacola: SacolaDto) {
    return this.salesService.criarPedido(req.user.id, sacola);
  }

  /**
   * ✅ REST: GET /sales/orders/:id - Obter pedido específico
   */
  @Get('orders/:id')
  @Roles(Role3.USER)
  @ApiOperation({
    summary: 'Obter pedido',
    description: 'Obtém detalhes de um pedido específico do cliente'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do pedido',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Pedido encontrado com sucesso'
  })
  @ApiResponse({
    status: 404,
    description: 'Pedido não encontrado'
  })
  async obterPedido(@Param('id') id: string, @Req() req) {
    return this.salesService.obterPedido(id, req.user.id);
  }

  /**
   * ✅ REST: PUT /sales/orders/:id/confirm - Confirmar pedido
   */
  @Put('orders/:id/confirm')
  @Roles(Role3.USER)
  @ApiOperation({
    summary: 'Confirmar pedido',
    description: 'Confirma um pedido e inicia o processo de entrega'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do pedido',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Pedido confirmado com sucesso'
  })
  async confirmarPedido(@Param('id') id: string, @Body() endereco: any) {
    return this.salesService.confirmarPedido(id, endereco);
  }

  /**
   * ✅ REST: POST /sales/orders/:id/apply-coupon - Aplicar cupom
   */
  @Post('orders/:id/apply-coupon')
  @Roles(Role3.USER)
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
  @ApiResponse({
    status: 400,
    description: 'Cupom inválido ou não aplicável'
  })
  async aplicarCupom(@Param('id') id: string, @Body() { codigo }: { codigo: string }) {
    return this.salesService.aplicarCupomAoPedido(id, codigo);
  }
}
