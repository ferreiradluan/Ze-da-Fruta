import { Module } from '@nestjs/common';
import { ImageService } from './services/image.service';
import { EventBusModule } from './event-bus';
import { UploadController } from './controllers/upload.controller';
import { AccountManagementModule } from '../1-account-management/1-account-management.module';
import { SalesModule } from '../2-sales/2-sales.module';
import { DeliveryModule } from '../3-delivery/3-delivery.module';

@Module({
  imports: [
    EventBusModule,
    AccountManagementModule,
    SalesModule,
    DeliveryModule,
  ],
  controllers: [UploadController],
  providers: [ImageService],
  exports: [ImageService, EventBusModule],
})
export class CommonModule {}
