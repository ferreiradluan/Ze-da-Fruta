import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './api/controllers/admin.controller';
import { AdminService } from './application/services/admin.service';
import { SolicitacaoParceiro } from '../1-account-management/domain/entities/solicitacao-parceiro.entity';
import { SolicitacaoParceiroRepository } from '../1-account-management/infrastructure/repositories/solicitacao-parceiro.repository';
import { AccountService } from '../1-account-management/application/services/account.service';
import { SalesService } from '../2-sales/application/services/sales.service';
import { PaymentModule } from '../4-payment/4-payment.module';
import { Usuario } from '../1-account-management/domain/entities/usuario.entity';
import { Admin } from '../1-account-management/domain/entities/admin.entity';
import { Produto } from '../2-sales/domain/entities/produto.entity';
import { Categoria } from '../2-sales/domain/entities/categoria.entity';
import { Estabelecimento } from '../2-sales/domain/entities/estabelecimento.entity';
import { Pedido } from '../2-sales/domain/entities/pedido.entity';
import { ItemPedido } from '../2-sales/domain/entities/item-pedido.entity';
import { Cupom } from '../2-sales/domain/entities/cupom.entity';
import { EventBusService } from '../common/event-bus';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Module({
  imports: [
    PaymentModule,
    TypeOrmModule.forFeature([
      // Entidades do Admin
      SolicitacaoParceiro,
      
      // Entidades do Account Management
      Usuario,
      Admin,
      
      // Entidades do Sales
      Produto,
      Categoria,
      Estabelecimento,
      Pedido,
      ItemPedido,
      Cupom
    ])
  ],
  controllers: [AdminController],  providers: [
    AdminService,
    SolicitacaoParceiroRepository,
    AccountService,
    SalesService,
    EventBusService,
    EventEmitter2
  ],
  exports: [AdminService]
})
export class AdminModule {}
