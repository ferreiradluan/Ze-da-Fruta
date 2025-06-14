import { Controller, Get, Post, UseGuards, Req, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../1-account-management/guards/jwt-auth.guard';
import { Public } from '../../../common/decorators/public.decorator';
import { SalesService } from '../../application/services/sales.service';

@Controller('sales/lojas')
export class LojasController {
  constructor(private readonly salesService: SalesService) {}

  // ========== FUNCIONALIDADES ESPECÍFICAS ==========
  // Funcionalidades básicas de listagem foram migradas para EstabelecimentosController
  // Este controller mantém apenas funcionalidades específicas de avaliação

  @Get('publico/horarios/:lojaId')
  @Public()
  @ApiTags('🛍️ Catálogo Público')
  @ApiOperation({
    summary: 'Obter horários de funcionamento da loja',
    description: 'Obtém os horários de funcionamento de uma loja específica'
  })
  @ApiParam({
    name: 'lojaId',
    description: 'ID da loja',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Horários de funcionamento retornados com sucesso'
  })
  async obterHorariosFuncionamento(@Param('lojaId') lojaId: string) {
    // Método placeholder - implementar conforme necessário
    return {
      lojaId,
      horarios: {
        segunda: { abertura: '08:00', fechamento: '18:00' },
        terca: { abertura: '08:00', fechamento: '18:00' },
        quarta: { abertura: '08:00', fechamento: '18:00' },
        quinta: { abertura: '08:00', fechamento: '18:00' },
        sexta: { abertura: '08:00', fechamento: '18:00' },
        sabado: { abertura: '08:00', fechamento: '12:00' },
        domingo: 'fechado'
      }
    };
  }

  @Get('publico/tempo-entrega/:lojaId')
  @Public()
  @ApiTags('🛍️ Catálogo Público')
  @ApiOperation({
    summary: 'Obter tempo estimado de entrega da loja',
    description: 'Obtém o tempo estimado de entrega para uma loja específica'
  })
  @ApiParam({
    name: 'lojaId',
    description: 'ID da loja',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Tempo de entrega retornado com sucesso'
  })
  async obterTempoEntrega(@Param('lojaId') lojaId: string) {
    // Método placeholder - implementar conforme necessário
    return {
      lojaId,
      tempoMinimo: 30,
      tempoMaximo: 60,
      unidade: 'minutos'
    };
  }
}
