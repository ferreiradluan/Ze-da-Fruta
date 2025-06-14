import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PedidosController } from './api/controllers/pedidos.controller';
import { ProdutosController } from './api/controllers/produtos.controller';
import { LojasController } from './api/controllers/lojas.controller';
import { SalesService } from './application/services/sales.service';
import { PedidoRepository } from './infrastructure/repositories/pedido.repository';
import { ProdutoRepository } from './infrastructure/repositories/produto.repository';
import { EstabelecimentoRepository } from './infrastructure/repositories/estabelecimento.repository';
import { CupomRepository } from './infrastructure/repositories/cupom.repository';
import { CategoriaRepository } from './infrastructure/repositories/categoria.repository';
import { Produto } from './domain/entities/produto.entity';
import { Categoria } from './domain/entities/categoria.entity';
import { Estabelecimento } from './domain/entities/estabelecimento.entity';
import { Pedido } from './domain/entities/pedido.entity';
import { ItemPedido } from './domain/entities/item-pedido.entity';
import { Cupom } from './domain/entities/cupom.entity';
import { PaymentModule } from '../4-payment/4-payment.module';
import { EventBusModule } from '../common/event-bus';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Produto,
      Categoria,
      Estabelecimento,
      Pedido,
      ItemPedido,
      Cupom
    ]),
    PaymentModule,
    EventBusModule
  ],  controllers: [
    // APENAS OS 3 ESPECIFICADOS NO DIAGRAMA:
    PedidosController,
    ProdutosController, 
    LojasController
  ],  providers: [
    // APENAS SalesService + Repositories:
    SalesService,
    PedidoRepository,
    ProdutoRepository,
    EstabelecimentoRepository,
    CupomRepository,
    CategoriaRepository
  ],
  exports: [SalesService]
})
export class SalesModule {}
