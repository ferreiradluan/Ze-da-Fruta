// Domain Events exports
export { DomainEvent } from './domain-event.base';

// Pedido Events
export {
  PedidoCriadoEvent,
  PedidoConfirmadoEvent,
  PedidoCanceladoEvent,
  PedidoStatusAtualizadoEvent,
  CupomAplicadoEvent
} from './pedido.events';

// Usuario Events
export {
  UsuarioCriadoEvent,
  UsuarioPromovidoEvent,
  UsuarioSuspensoEvent,
  PerfilCompletadoEvent
} from './usuario.events';

// Produto Events
export {
  ProdutoCriadoEvent,
  EstoqueAtualizadoEvent,
  ProdutoStatusAlteradoEvent
} from './produto.events';
