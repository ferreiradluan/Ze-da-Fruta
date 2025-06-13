import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryEntregasController } from './entregas.controller';
import { DeliveryEntregadorController } from './entregador.controller';
import { DeliveryCarteiraController } from './carteira.controller';
import { DeliveryService } from './delivery.service';

@Module({
  imports: [TypeOrmModule.forFeature([])],
  controllers: [DeliveryEntregasController, DeliveryEntregadorController, DeliveryCarteiraController],
  providers: [DeliveryService],
  exports: [DeliveryService],
})
export class DeliveryModule {}
