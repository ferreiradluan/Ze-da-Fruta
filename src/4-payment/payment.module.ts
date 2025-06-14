import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentController } from './api/controllers/payment.controller';
import { PaymentService } from './application/services/payment.service';
import { PagamentoRepository } from './infrastructure/repositories/pagamento.repository';
import { Pagamento } from './domain/entities/pagamento.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pagamento])
  ],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    {
      provide: 'IPagamentoRepository',
      useClass: PagamentoRepository
    }
  ],
  exports: [PaymentService]
})
export class PaymentModule {}
