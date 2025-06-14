import { Module } from '@nestjs/common';
import { ImageService } from './services/image.service';
import { EventBusModule } from './event-bus';
import { UploadController } from './controllers/upload.controller';
import { HealthController } from './controllers/health.controller';
import { DomainMetricsService } from './monitoring/domain-metrics.service';
import { DomainHealthService } from './health/domain-health.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pedido } from '../2-sales/domain/entities/pedido.entity';
import { Produto } from '../2-sales/domain/entities/produto.entity';
import { Estabelecimento } from '../2-sales/domain/entities/estabelecimento.entity';
import { Usuario } from '../1-account-management/domain/entities/usuario.entity';
import { AccountManagementModule } from '../1-account-management/1-account-management.module';
import { SalesModule } from '../2-sales/2-sales.module';
import { DeliveryModule } from '../3-delivery/3-delivery.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Pedido,
      Produto,
      Estabelecimento,
      Usuario
    ]),
    EventBusModule,
    AccountManagementModule,
    SalesModule,
    DeliveryModule,
  ],
  controllers: [
    UploadController,
    HealthController
  ],
  providers: [
    ImageService,
    DomainMetricsService,
    DomainHealthService
  ],
  exports: [
    ImageService, 
    EventBusModule,
    DomainMetricsService,
    DomainHealthService
  ],
})
export class CommonModule {}
