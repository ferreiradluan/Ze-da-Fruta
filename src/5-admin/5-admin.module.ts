import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

// Entidades próprias do Admin
import { AuditLog } from './domain/entities/audit-log.entity';
import { PlatformSetting } from './domain/entities/platform-setting.entity';

// Repositories próprios do Admin
import { AuditLogRepository } from './infrastructure/repositories/audit-log.repository';
import { PlatformSettingRepository } from './infrastructure/repositories/platform-setting.repository';

// Módulos de outros domínios (para injetar services)
import { AccountManagementModule } from '../1-account-management/1-account-management.module';
import { SalesModule } from '../2-sales/2-sales.module';
import { PaymentModule } from '../4-payment/payment.module';
// import { DeliveryModule } from '../3-delivery/3-delivery.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Apenas entidades próprias do Admin
      AuditLog,
      PlatformSetting
    ]),
    
    // Importar módulos para usar seus services
    AccountManagementModule,
    SalesModule,
    PaymentModule,
    // DeliveryModule
  ],
  controllers: [AdminController],
  providers: [
    AdminService,
    AuditLogRepository,
    PlatformSettingRepository
  ],
  exports: [AdminService]
})
export class AdminModule {}
