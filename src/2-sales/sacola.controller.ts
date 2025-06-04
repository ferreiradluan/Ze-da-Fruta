import { Controller, Get, Post, Body } from '@nestjs/common';
import { SalesService } from './sales.service';

@Controller('sales/sacola')
export class SalesSacolaController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  getSacola() {
    // Implementar lógica para buscar sacola do usuário autenticado
    return this.salesService.getSacola();
  }

  @Post('itens')
  adicionarItem(@Body() itemDto: any) {
    return this.salesService.adicionarItemSacola(itemDto);
  }
}
