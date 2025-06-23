import { Controller, Get, Param, Query } from '@nestjs/common';
import { EstabelecimentoService } from '../../application/services/estabelecimento.service';
import { Public } from '../../../common/decorators/public.decorator';

@Controller('public/establishments')
export class PublicEstablishmentsController {
  constructor(private readonly estabelecimentoService: EstabelecimentoService) {}

  @Get()
  @Public()
  async listarEstabelecimentos(@Query() filtros: any) {
    return this.estabelecimentoService.listarComFiltros(filtros);
  }

  @Get(':id')
  @Public()
  async obterDetalhes(@Param('id') id: string) {
    return this.estabelecimentoService.obterDetalhesPublicos(id);
  }
}
