import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Entregador } from './domain/entities/entregador.entity';
import { Entrega } from './domain/entities/entrega.entity';
import { DeliveryService } from './application/services/delivery.service';
import { DeliveryController } from './api/controllers/delivery.controller';
import { EntregaRepository } from './infrastructure/repositories/entrega.repository';
import { EntregadorRepository } from './infrastructure/repositories/entregador.repository';
import { EntregaDomainService } from './domain/services/entrega-domain.service';
import { EventBusModule } from '../common/event-bus';

// Injection tokens for repository interfaces
export const ENTREGA_REPOSITORY_TOKEN = 'IEntregaRepository';
export const ENTREGADOR_REPOSITORY_TOKEN = 'IEntregadorRepository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Entregador, Entrega]),
    EventBusModule
  ],
  controllers: [DeliveryController],
  providers: [
    DeliveryService,
    EntregaDomainService,
    EntregaRepository,
    EntregadorRepository,
    {
      provide: ENTREGA_REPOSITORY_TOKEN,
      useClass: EntregaRepository,
    },
    {
      provide: ENTREGADOR_REPOSITORY_TOKEN,
      useClass: EntregadorRepository,
    },
  ],
  exports: [
    DeliveryService,
    EntregaDomainService,
    ENTREGA_REPOSITORY_TOKEN,
    ENTREGADOR_REPOSITORY_TOKEN,
  ],
})
export class DeliveryModule {}
