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

// Rich Domain Model imports
import { ProdutoDomainService, PedidoDomainService } from './domain/services';
import { DomainEventDispatcher } from '../common/domain/events/domain-event.base';
import { RichDomainBootstrap } from '../common/domain/rich-domain-bootstrap';
import { DomainEventRegistry } from '../common/domain/events/domain-event-registry';
import { DomainServiceIntegration } from '../common/domain/services/domain-service-integration';

// Domain Event Handlers
import { 
  ProdutoCriadoHandler,
  ProdutoEstoqueAlteradoHandler,
  ProdutoEstoqueCriticoHandler,
  ProdutoPrecoAlteradoHandler,
  ProdutoDesativadoHandler
} from './domain/events/handlers/produto.handlers';

import {
  PedidoCriadoHandler,
  PedidoConfirmadoHandler,
  PedidoCanceladoHandler,
  PedidoEntregueHandler,
  ItemAdicionadoHandler,
  ItemRemovidoHandler,
  CupomAplicadoHandler
} from './domain/events/handlers/pedido.handlers';

// Cross-domain handlers
import { CrossDomainEventHandlers } from '../common/domain/events/cross-domain-handlers';

// Repository Interface Providers
import { IProdutoRepository } from './domain/repositories/produto.repository.interface';
import { IPedidoRepository } from './domain/repositories/pedido.repository.interface';

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
  providers: [
    // Application Services
    SalesService,
    
    // Rich Domain Model Components
    ProdutoDomainService,
    PedidoDomainService,
    DomainEventDispatcher,
    DomainEventRegistry,
    DomainServiceIntegration,
    RichDomainBootstrap,
    
    // Domain Event Handlers - Produto
    ProdutoCriadoHandler,
    ProdutoEstoqueAlteradoHandler,
    ProdutoEstoqueCriticoHandler,
    ProdutoPrecoAlteradoHandler,
    ProdutoDesativadoHandler,
    
    // Domain Event Handlers - Pedido
    PedidoCriadoHandler,
    PedidoConfirmadoHandler,
    PedidoCanceladoHandler,
    PedidoEntregueHandler,
    ItemAdicionadoHandler,
    ItemRemovidoHandler,
    CupomAplicadoHandler,
    
    // Cross-domain handlers
    CrossDomainEventHandlers,
    
    // Repository Interface Providers (Dependency Injection)
    {
      provide: 'IProdutoRepository',
      useExisting: 'produtoRepository', // Will be replaced with proper implementation
    },
    {
      provide: 'IPedidoRepository', 
      useExisting: 'pedidoRepository', // Will be replaced with proper implementation
    },
  ],
  exports: [
    SalesService,
    
    // Export Domain Services for cross-module usage
    ProdutoDomainService,
    PedidoDomainService,
    DomainServiceIntegration,
  ]
})
export class SalesModule {
  constructor(private readonly richDomainBootstrap: RichDomainBootstrap) {}

  async onModuleInit() {
    // Initialize Rich Domain Model components
    await this.richDomainBootstrap.initialize();
  }
}
