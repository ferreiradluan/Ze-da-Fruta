// Domínio de Entregas - Módulo de Delivery Modularizado
export { DeliveryModule } from './3-delivery.module';
export { DeliveryController } from './api/controllers/delivery.controller';
export { DeliveryService } from './application/services/delivery.service';
export { EntregaRepository } from './infrastructure/repositories/entrega.repository';
export { Entrega } from './domain/entities/entrega.entity';
export { Entregador } from './domain/entities/entregador.entity';
export { EnderecoVO } from './domain/value-objects/endereco-vo';
export { StatusEntrega, StatusEntregaType, isValidStatusEntrega, STATUS_ENTREGA_VALUES } from './domain/constants/status-entrega.constants';
export { StatusEntregador, StatusEntregadorType, isValidStatusEntregador, STATUS_ENTREGADOR_VALUES } from './domain/constants/status-entregador.constants';
export { StatusDisponibilidade, StatusDisponibilidadeType, isValidStatusDisponibilidade, STATUS_DISPONIBILIDADE_VALUES } from './domain/constants/status-disponibilidade.constants';
