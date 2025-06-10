import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentController } from './api/controllers/payment.controller';
import { PaymentService } from './application/services/payment.service';
import { EstoqueService } from './application/services/estoque.service';
import { PedidoEventHandler } from './application/services/pedido-event-handler.service';
import { Pagamento } from './domain/entities/pagamento.entity';
import { PagamentoRepository } from './infrastructure/repositories/pagamento.repository';
import { EventBusModule } from '../common/event-bus';

// Importar entidades necessárias para EstoqueService
import { Produto } from '../2-sales/domain/entities/produto.entity';
import { Pedido } from '../2-sales/domain/entities/pedido.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Pagamento, Produto, Pedido]),
    EventBusModule
  ],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    EstoqueService,
    PedidoEventHandler,
    PagamentoRepository
  ],
  exports: [PaymentService]
})
export class PaymentModule {
  // Event handlers agora são registrados automaticamente usando @OnEvent
}
