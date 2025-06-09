import { Specification } from '../../../common/domain/specifications/specification.base';
import { Entrega } from '../entities/entrega.entity';
import { StatusEntrega } from '../enums/status-entrega.enum';

/**
 * Base specification for deliveries
 */
export abstract class EntregaSpecification extends Specification<Entrega> {}

/**
 * Specification to check if delivery is pending
 */
export class EntregaPendenteSpecification extends EntregaSpecification {
  isSatisfiedBy(entrega: Entrega): boolean {
    return entrega.status === StatusEntrega.PENDENTE;
  }

  toString(): string {
    return 'Delivery is pending';
  }
}

/**
 * Specification to check if delivery is in progress
 */
export class EntregaEmAndamentoSpecification extends EntregaSpecification {
  isSatisfiedBy(entrega: Entrega): boolean {
    return entrega.status === StatusEntrega.COLETADO || 
           entrega.status === StatusEntrega.EM_TRANSITO;
  }

  toString(): string {
    return 'Delivery is in progress';
  }
}

/**
 * Specification to check if delivery is completed
 */
export class EntregaConcluidaSpecification extends EntregaSpecification {
  isSatisfiedBy(entrega: Entrega): boolean {
    return entrega.status === StatusEntrega.ENTREGUE;
  }

  toString(): string {
    return 'Delivery is completed';
  }
}

/**
 * Specification to check if delivery is cancelled
 */
export class EntregaCanceladaSpecification extends EntregaSpecification {
  isSatisfiedBy(entrega: Entrega): boolean {
    return entrega.status === StatusEntrega.CANCELADA;
  }

  toString(): string {
    return 'Delivery is cancelled';
  }
}

/**
 * Specification to check if delivery can be accepted
 */
export class EntregaPodeSerAceitaSpecification extends EntregaSpecification {
  isSatisfiedBy(entrega: Entrega): boolean {
    return entrega.status === StatusEntrega.PENDENTE && 
           entrega.entregadorId === null;
  }

  toString(): string {
    return 'Delivery can be accepted';
  }
}

/**
 * Specification to check if delivery can be started
 */
export class EntregaPodeSerIniciadaSpecification extends EntregaSpecification {
  isSatisfiedBy(entrega: Entrega): boolean {
    return entrega.status === StatusEntrega.ACEITA && 
           entrega.entregadorId !== null;
  }

  toString(): string {
    return 'Delivery can be started';
  }
}

/**
 * Specification to check if delivery is overdue
 */
export class EntregaAtrasadaSpecification extends EntregaSpecification {
  isSatisfiedBy(entrega: Entrega): boolean {
    if (!entrega.prazoEntrega) {
      return false;
    }
    
    const now = new Date();
    return now > entrega.prazoEntrega && 
           entrega.status !== StatusEntrega.ENTREGUE &&
           entrega.status !== StatusEntrega.CANCELADA;
  }

  toString(): string {
    return 'Delivery is overdue';
  }
}

/**
 * Specification to check if delivery requires attention
 */
export class EntregaRequerAtencaoSpecification extends EntregaSpecification {
  isSatisfiedBy(entrega: Entrega): boolean {
    const isOverdue = new EntregaAtrasadaSpecification().isSatisfiedBy(entrega);
    const isStuckInProgress = this.isStuckInProgress(entrega);
    
    return isOverdue || isStuckInProgress;
  }

  private isStuckInProgress(entrega: Entrega): boolean {
    if (entrega.status !== StatusEntrega.EM_TRANSITO) {
      return false;
    }
    
    // Check if delivery has been in transit for too long (e.g., more than 2 hours)
    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
    
    return entrega.updatedAt < twoHoursAgo;
  }

  toString(): string {
    return 'Delivery requires attention';
  }
}

/**
 * Specification to check if delivery has valid time window
 */
export class EntregaTemJanelaValidaSpecification extends EntregaSpecification {
  isSatisfiedBy(entrega: Entrega): boolean {
    if (!entrega.janelaEntregaInicio || !entrega.janelaEntregaFim) {
      return true; // No time window restrictions
    }
    
    return entrega.janelaEntregaInicio < entrega.janelaEntregaFim;
  }

  toString(): string {
    return 'Delivery has valid time window';
  }
}

/**
 * Specification to check if delivery can be redistributed
 */
export class EntregaPodeSerRedistribuidaSpecification extends EntregaSpecification {
  isSatisfiedBy(entrega: Entrega): boolean {
    return (entrega.status === StatusEntrega.ACEITA || 
            entrega.status === StatusEntrega.COLETADO) &&
           entrega.entregadorId !== null;
  }

  toString(): string {
    return 'Delivery can be redistributed';
  }
}
