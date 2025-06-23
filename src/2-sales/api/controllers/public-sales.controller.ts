import { Controller, Get, Query } from '@nestjs/common';
import { SalesService } from '../../application/services/sales.service';
import { Public } from '../../../common/decorators/public.decorator';

@Controller('public/sales')
export class PublicSalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get('produtos')
  @Public()
  async listarProdutosPublicos(@Query() filtros: any) {
    return this.salesService.buscarProdutosComFiltros(filtros);
  }
}
