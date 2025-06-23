import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// Controllers principais (refatorados)
import { SalesController } from './api/controllers/sales.controller';
import { PedidosController } from './api/controllers/pedidos.controller';
import { CartController } from './api/controllers/cart.controller';

// Controllers públicos especializados
import { PublicSalesController } from './api/controllers/public-sales.controller';
import { PublicCatalogController } from './api/controllers/public-catalog.controller';
import { PublicEstablishmentsController } from './api/controllers/public-establishments.controller';
import { SalesPublicController } from './api/controllers/sales-public.controller';

// Controllers específicos (mantidos para funcionalidades específicas)
import { ProdutosController } from './api/controllers/produtos.controller';
import { LojasController } from './api/controllers/lojas.controller';
import { CategoriasController } from './api/controllers/categorias.controller';
import { EstabelecimentosController } from './api/controllers/estabelecimentos.controller';
import { ProductsPublicController } from './api/controllers/products-public.controller';
import { CategoriasPublicController } from './api/controllers/categorias-public.controller';

// Services
import { SalesService } from './application/services/sales.service';
import { CategoriaService } from './application/services/categoria.service';
import { EstabelecimentoService } from './application/services/estabelecimento.service';
import { CupomService } from './application/services/cupom.service';

// Repositories
import { PedidoRepository } from './infrastructure/repositories/pedido.repository';
import { ProdutoRepository } from './infrastructure/repositories/produto.repository';
import { EstabelecimentoRepository } from './infrastructure/repositories/estabelecimento.repository';
import { CupomRepository } from './infrastructure/repositories/cupom.repository';
import { CategoriaRepository } from './infrastructure/repositories/categoria.repository';

// Entities
import { Produto } from './domain/entities/produto.entity';
import { Categoria } from './domain/entities/categoria.entity';
import { Estabelecimento } from './domain/entities/estabelecimento.entity';
import { Pedido } from './domain/entities/pedido.entity';
import { ItemPedido } from './domain/entities/item-pedido.entity';
import { Cupom } from './domain/entities/cupom.entity';

// External modules
import { PaymentModule } from '../4-payment/payment.module';
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
    // Controllers principais (Core Sales Domain):
    SalesController,
    PedidosController,
    CartController, // ✅ ADICIONADO: Registrar CartController
      // Controllers públicos especializados:
    PublicSalesController,        // Vendas públicas
    PublicCatalogController,      // Catálogo público  
    PublicEstablishmentsController, // Estabelecimentos públicos
    SalesPublicController,        // Sales público (/sales/public/*)
    ProductsPublicController,     // Produtos públicos (/products)
    CategoriasPublicController,   // Categorias públicas (/categorias)
    
    // Controllers específicos (funcionalidades específicas):
    ProdutosController,
    LojasController, 
    CategoriasController,
    EstabelecimentosController
  ],providers: [
    // Services principais:
    SalesService,
    CategoriaService,
    EstabelecimentoService,
    CupomService,
    
    // Repositories:
    PedidoRepository,
    ProdutoRepository,
    EstabelecimentoRepository,
    CupomRepository,
    CategoriaRepository
  ],
  exports: [
    SalesService,
    CategoriaService,
    EstabelecimentoService,
    CupomService,
  ],
})
export class SalesModule {}
