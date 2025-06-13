import { Controller, Get, Post, Param, Body, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SalesService } from './sales.service';

@Controller('sales/pedidos')
export class SalesPedidosController {
  constructor(private readonly salesService: SalesService) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getPedidosMe(@Req() req: any) {
    return this.salesService.getPedidosByUserId(req.user.id);
  }

  @Post()
  criarPedido(@Body() pedidoDto: any) {
    return this.salesService.criarPedido(pedidoDto);
  }

  @Post(':id/pedir-novamente')
  pedirNovamente(@Param('id') id: number) {
    return this.salesService.pedirNovamente(id);
  }

  @Post(':id/avaliar')
  avaliarPedido(@Param('id') id: number, @Body() avaliacao: any) {
    return this.salesService.avaliarPedido(id, avaliacao);
  }
}
