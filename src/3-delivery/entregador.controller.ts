import { Controller, Get, Post, Body } from '@nestjs/common';
import { DeliveryService } from './delivery.service';

@Controller('delivery/entregador/me')
export class DeliveryEntregadorController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get('entregas')
  getMinhasEntregas() {
    return this.deliveryService.getMinhasEntregas();
  }

  @Post('status')
  atualizarStatus(@Body() statusDto: any) {
    return this.deliveryService.atualizarStatusEntregador(statusDto);
  }

  @Get('perfil')
  getPerfil() {
    return this.deliveryService.getPerfilEntregador();
  }
}
