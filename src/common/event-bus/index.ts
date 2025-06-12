// Arquivo para comunicação assíncrona interna (Event Bus)
export { EventBusModule } from './event-bus.module';
export { EventBusService } from './event-bus.service';
export type { 
  DomainEvent, 
  PedidoCriadoEvent, 
  PedidoCanceladoEvent, 
  PagamentoProcessadoEvent 
} from './event-bus.service';
