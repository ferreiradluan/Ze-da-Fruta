import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryController } from './api/controllers/delivery.controller';
import { DeliveryService } from './application/services/delivery.service';
import { EntregaRepository } from './infrastructure/repositories/entrega.repository';
import { Entrega } from './domain/entities/entrega.entity';
import { Entregador } from './domain/entities/entregador.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Entrega, Entregador])
  ],
  controllers: [
    DeliveryController  // ✅ APENAS 1 CONTROLLER
  ],
  providers: [
    DeliveryService,    // ✅ APENAS 1 SERVICE
    EntregaRepository
  ],
  exports: [
    DeliveryService
  ]
})
export class DeliveryModule {}
