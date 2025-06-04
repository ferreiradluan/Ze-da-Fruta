import { Controller, Get, Post, Body } from '@nestjs/common';
import { DeliveryService } from './delivery.service';

@Controller('delivery/entregador/me/carteira')
export class DeliveryCarteiraController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get()
  getCarteira() {
    return this.deliveryService.getCarteira();
  }

  @Post('saques')
  solicitarSaque(@Body() saqueDto: any) {
    return this.deliveryService.solicitarSaque(saqueDto);
  }
}
