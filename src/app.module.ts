// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CommonModule } from './common/common.module';
import { AccountManagementModule } from './1-account-management/1-account-management.module';
import { SalesModule } from './2-sales/2-sales.module';
import { DeliveryModule } from './3-delivery/3-delivery.module';
import { PaymentModule } from './4-payment/4-payment.module';
import { AdminModule } from './5-admin/5-admin.module';
import { SecurityConfig, getSecurityConfig } from './common/config/security.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EventEmitterModule.forRoot({
      // Use this instance across the whole app
      global: true,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const securityConfig = getSecurityConfig(configService);
        return [
          {
            ttl: securityConfig.rateLimiting.public.ttl * 1000, // Convert to ms
            limit: securityConfig.rateLimiting.public.limit,
            name: 'default',
          },
        ];
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'sqlite',
        database: configService.get<string>('DATABASE_PATH') || './ze_da_fruta.sqlite',
        autoLoadEntities: true,
        // ATENÇÃO: Ativar synchronize em produção TEMPORARIAMENTE para criar as tabelas
        synchronize: true, // <-- Ativado para o primeiro deploy
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),
    CommonModule,
    AccountManagementModule,
    SalesModule,
    DeliveryModule,
    PaymentModule,
    AdminModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}