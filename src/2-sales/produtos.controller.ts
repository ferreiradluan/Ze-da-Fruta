import { Controller, Get, Param } from '@nestjs/common';
import { SalesService } from './sales.service';

@Controller('sales/produtos')
export class SalesProdutosController {
  constructor(private readonly salesService: SalesService) {}

  @Get(':id')
  getProduto(@Param('id') id: number) {
    return this.salesService.getProduto(id);
  }
}
