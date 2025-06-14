import { Controller, Get, Post, Param, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty } from 'class-validator';
import { DeliveryService } from '../../application/services/delivery.service';
import { StatusEntregaType, STATUS_ENTREGA_VALUES } from '../../domain/constants/status-entrega.constants';

// DTO para atualização de status
class AtualizarStatusEntregaDto {
  @ApiProperty({
    description: 'Novo status da entrega',
    type: 'string',
    examples: STATUS_ENTREGA_VALUES,
    example: 'COLETADO'
  })
  @IsNotEmpty()
  @IsIn(STATUS_ENTREGA_VALUES, {
    message: `Status deve ser um dos valores: ${STATUS_ENTREGA_VALUES.join(', ')}` 
  })
  novoStatus!: StatusEntregaType;
}

@ApiTags('🚚 Delivery - Gestão de Entregas')
@Controller('delivery')
export class DeliveryController {
  constructor(
    private readonly deliveryService: DeliveryService
  ) {}

  // ✅ ENDPOINT 1 DO DIAGRAMA
  @Get('entregas/disponiveis')
  @ApiOperation({ summary: 'Buscar entregas disponíveis' })
  async getEntregasDisponiveis() {
    return await this.deliveryService.buscarEntregasDisponiveis();
  }

  // ✅ ENDPOINT 2 DO DIAGRAMA
  @Post('entregas/:id/aceitar')
  @ApiOperation({ summary: 'Aceitar entrega' })
  async aceitarEntrega(
    @Param('id') entregaId: string, 
    @Req() req: any
  ) {
    const entregadorId = req.user?.id; // Extrair do token JWT
    return await this.deliveryService.aceitarEntrega(entregaId, entregadorId);
  }

  // ✅ ENDPOINT 3 DO DIAGRAMA
  @Post('entregas/:id/status')
  @ApiOperation({ summary: 'Atualizar status da entrega' })
  async updateStatusEntrega(
    @Param('id') entregaId: string,
    @Body() dto: AtualizarStatusEntregaDto,
    @Req() req: any
  ) {
    const entregadorId = req.user?.id;
    return await this.deliveryService.atualizarStatusEntrega(
      entregaId, 
      entregadorId, 
      dto.novoStatus
    );
  }

  // ✅ ENDPOINT ADICIONAL PARA CONSULTA DE STATUS POR PEDIDO
  @Get('pedidos/:pedidoId/status')
  @ApiOperation({ summary: 'Obter status de entrega por pedido' })
  async obterStatusEntrega(@Param('pedidoId') pedidoId: string) {
    return await this.deliveryService.obterStatusEntrega(pedidoId);
  }
}
