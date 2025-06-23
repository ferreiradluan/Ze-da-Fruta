import { 
  Controller, 
  Get, 
  Param,
  Query
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../../common/decorators/public.decorator';
import { SalesService } from '../../application/services/sales.service';

@Controller('produtos')
export class ProdutosController {
  constructor(private readonly salesService: SalesService) {}

  @Get('publico/buscar')
  @Public()
  @ApiTags('🛍️ Catálogo Público')
  @ApiOperation({
    summary: 'Buscar produtos público',
    description: 'Busca produtos com filtros para o público geral'
  })
  @ApiResponse({
    status: 200,
    description: 'Produtos encontrados com sucesso'
  })
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async buscarProdutosPublico(@Query() filtros: any) {
    return this.salesService.buscarProdutosPublico(filtros);
  }
}
