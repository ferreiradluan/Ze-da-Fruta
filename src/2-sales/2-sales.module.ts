import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PedidosController } from './api/controllers/pedidos.controller';
import { ProdutosController } from './api/controllers/produtos.controller';
import { LojasController } from './api/controllers/lojas.controller';
import { CategoriasController } from './api/controllers/categorias.controller';
import { CuponsController } from './api/controllers/cupons.controller';
import { LojistaPedidosController } from './api/controllers/lojista-pedidos.controller';
import { SalesService } from './application/services/sales.service';
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
  ],
  controllers: [
    PedidosController, 
    ProdutosController, 
    LojasController,
    CategoriasController,
    CuponsController,
    LojistaPedidosController
  ],
  providers: [SalesService],
  exports: [SalesService]
})
export class SalesModule {}
