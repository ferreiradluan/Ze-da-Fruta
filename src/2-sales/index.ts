// Índice principal do domínio 2-sales
// Exporta todas as principais classes, interfaces e tipos

// ===== ENTIDADES (Rich Domain Model) =====
export { Pedido } from './domain/entities/pedido.entity';
export { ItemPedido } from './domain/entities/item-pedido.entity';
export { Produto } from './domain/entities/produto.entity';
export { Estabelecimento } from './domain/entities/estabelecimento.entity';
export { Cupom } from './domain/entities/cupom.entity';
export { Categoria } from './domain/entities/categoria.entity';

// ===== VALUE OBJECTS =====
export { Dinheiro } from './domain/value-objects/dinheiro.vo';

// ===== ENUMS =====
export { StatusPedido } from './domain/enums/status-pedido.enum';

// ===== REPOSITORIES =====
export { PedidoRepository } from './infrastructure/repositories/pedido.repository';
export { ProdutoRepository } from './infrastructure/repositories/produto.repository';
export { EstabelecimentoRepository } from './infrastructure/repositories/estabelecimento.repository';
export { CupomRepository } from './infrastructure/repositories/cupom.repository';

// ===== SERVICES =====
export { SalesService } from './application/services/sales.service';

// ===== CONTROLLERS =====
export { PedidosController } from './api/controllers/pedidos.controller';
export { ProdutosController } from './api/controllers/produtos.controller';
export { LojasController } from './api/controllers/lojas.controller';

// ===== EVENTOS DE DOMÍNIO =====
export * from './domain/events';

// ===== MÓDULO =====
export { SalesModule } from './2-sales.module';
