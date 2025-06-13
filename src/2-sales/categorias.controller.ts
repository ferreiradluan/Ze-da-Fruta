import { Controller, Get } from '@nestjs/common';
import { SalesService } from './sales.service';

@Controller('sales/categorias')
export class SalesCategoriasController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  getCategorias() {
    return this.salesService.getCategorias();
  }
}
