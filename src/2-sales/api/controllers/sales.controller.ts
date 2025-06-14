import { 
  Controller, 
  Get, 
  Post, 
  Put,
  Param, 
  Body, 
  UseGuards,
  Req,
  ValidationPipe,
  UsePipes 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Roles } from '../../../1-account-management/decorators/roles.decorator';
import { Role3 } from '../../../1-account-management/enums/role.enum';
import { JwtAuthGuard } from '../../../1-account-management/guards/jwt-auth.guard';
import { RolesGuard } from '../../../1-account-management/guards/roles.guard';
import { SalesService } from '../../application/services/sales.service';
import { PedidoResponseDto } from '../dto/response/pedido-response.dto';
import { CheckoutDto, AplicarCupomDto, ConfirmarPedidoDto } from '../dto/requests/checkout.dto';

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

  // ========== CORE SALES ENDPOINTS ==========
    /**
   * ✅ Endpoint focado no domínio de vendas - criar pedido
   */
  @Post('cart/checkout')
  @Roles(Role3.USER)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: 'Checkout do carrinho',
    description: 'Finaliza a compra criando um pedido com os itens do carrinho'
  })
  @ApiBody({
    type: CheckoutDto,
    description: 'Dados do checkout'
  })
  @ApiResponse({
    status: 201,
    description: 'Pedido criado com sucesso',
    type: PedidoResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou estoque insuficiente'
  })
  async criarPedido(@Req() req, @Body() checkout: CheckoutDto) {
    // Converter CheckoutDto para SacolaDto
    const sacola = {
      itens: checkout.itens,
      enderecoEntrega: checkout.enderecoEntrega,
      observacoes: checkout.observacoes
    };
    return this.salesService.criarPedido(req.user.id, sacola);
  }

  /**
   * ✅ Endpoint focado no domínio de vendas - obter pedido
   */
  @Get('orders/:id')
  @Roles(Role3.USER)
  @ApiOperation({
    summary: 'Obter pedido específico',
    description: 'Obtém os detalhes de um pedido do cliente logado'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do pedido',
    type: 'string'
  })  @ApiResponse({
    status: 200,
    description: 'Pedido encontrado com sucesso',
    type: PedidoResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Pedido não encontrado'
  })
  async obterPedido(@Param('id') id: string, @Req() req) {
    return this.salesService.obterPedido(id, req.user.id);
  }
  /**
   * ✅ Endpoint focado no domínio de vendas - confirmar pedido
   */
  @Put('orders/:id/confirm')
  @Roles(Role3.USER)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: 'Confirmar pedido',
    description: 'Confirma o pedido com endereço de entrega'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do pedido',
    type: 'string'
  })
  @ApiBody({
    type: ConfirmarPedidoDto,
    description: 'Dados para confirmação do pedido'
  })
  @ApiResponse({
    status: 200,
    description: 'Pedido confirmado com sucesso'
  })
  @ApiResponse({
    status: 400,
    description: 'Pedido não pode ser confirmado'
  })
  async confirmarPedido(@Param('id') id: string, @Body() confirmacao: ConfirmarPedidoDto) {
    return this.salesService.confirmarPedido(id, confirmacao.endereco);
  }
  /**
   * ✅ Endpoint focado no domínio de vendas - aplicar cupom
   */
  @Post('orders/:id/apply-coupon')
  @Roles(Role3.USER)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: 'Aplicar cupom ao pedido',
    description: 'Aplica um cupom de desconto a um pedido específico'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do pedido',
    type: 'string'
  })
  @ApiBody({
    type: AplicarCupomDto,
    description: 'Dados do cupom'
  })
  @ApiResponse({
    status: 200,
    description: 'Cupom aplicado com sucesso'
  })
  @ApiResponse({
    status: 400,
    description: 'Cupom inválido ou expirado'
  })
  async aplicarCupom(@Param('id') id: string, @Body() cupom: AplicarCupomDto) {
    return this.salesService.aplicarCupomAoPedido(id, cupom.codigo);
  }
}
