import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Entregador } from './domain/entities/entregador.entity';
import { Entrega } from './domain/entities/entrega.entity';
import { DeliveryService } from './application/services/delivery.service';
import { DeliveryController } from './api/controllers/delivery.controller';
import { EntregaRepository } from './infrastructure/repositories/entrega.repository';
import { EventBusModule } from '../common/event-bus';

@Module({
  imports: [
    TypeOrmModule.forFeature([Entregador, Entrega]),
    EventBusModule
  ],
  controllers: [DeliveryController],
  providers: [
    DeliveryService,
    EntregaRepository
  ],
  exports: [DeliveryService],
})
export class DeliveryModule {}
