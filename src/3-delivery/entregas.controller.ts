import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { DeliveryService } from './delivery.service';

@Controller('delivery/entregas')
export class DeliveryEntregasController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get('disponiveis')
  getDisponiveis() {
    return this.deliveryService.getEntregasDisponiveis();
  }

  @Patch(':id/status')
  atualizarStatus(@Param('id') id: number, @Body() statusDto: any) {
    return this.deliveryService.atualizarStatusEntrega(id, statusDto);
  }
}
