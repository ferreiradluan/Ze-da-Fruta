import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { SalesService } from './sales.service';

@Controller('sales/pedidos')
export class SalesPedidosController {
  constructor(private readonly salesService: SalesService) {}

  @Get('me')
  getPedidosMe() {
    // Implementar lógica para buscar pedidos do usuário autenticado
    return this.salesService.getPedidosMe();
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
