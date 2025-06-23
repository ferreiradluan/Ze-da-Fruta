import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Services
import { DomainMetricsService } from './monitoring/domain-metrics.service';
import { DomainHealthService } from './health/domain-health.service';

// Controllers
import { MonitoringController } from './controllers/monitoring.controller';

// Entities
import { Pedido } from '../2-sales/domain/entities/pedido.entity';
import { Produto } from '../2-sales/domain/entities/produto.entity';
import { Estabelecimento } from '../2-sales/domain/entities/estabelecimento.entity';
import { Usuario } from '../1-account-management/domain/entities/usuario.entity';

/**
 * 📊 FASE 6: MONITORING MODULE
 * 
 * ✅ Módulo consolidado para monitoramento e health checks
 * ✅ Métricas por domínio
 * ✅ Health checks detalhados
 * ✅ Endpoints para integração com ferramentas externas
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Pedido,
      Produto,
      Estabelecimento,
      Usuario
    ])
  ],
  providers: [
    DomainMetricsService,
    DomainHealthService
  ],
  controllers: [
    MonitoringController
  ],
  exports: [
    DomainMetricsService,
    DomainHealthService
  ]
})
export class MonitoringModule {}
