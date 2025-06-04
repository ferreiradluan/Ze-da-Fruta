import { Controller, Get, Param } from '@nestjs/common';
import { SalesService } from './sales.service';

@Controller('sales/lojas')
export class SalesLojasController {
  constructor(private readonly salesService: SalesService) {}

  @Get(':id')
  getLoja(@Param('id') id: number) {
    return this.salesService.getLoja(id);
  }

  @Get(':id/produtos')
  getProdutosDaLoja(@Param('id') id: number) {
    return this.salesService.getProdutosDaLoja(id);
  }
}
