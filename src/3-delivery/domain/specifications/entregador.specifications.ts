import { Specification } from '../../../common/domain/specifications/specification.base';
import { Entregador, StatusEntregador, StatusDisponibilidade, TipoVeiculo } from '../entities/entregador.entity';

/**
 * Base specification for delivery drivers
 */
export abstract class EntregadorSpecification extends Specification<Entregador> {}

/**
 * Specification to check if delivery driver is active
 */
export class EntregadorAtivoSpecification extends EntregadorSpecification {
  isSatisfiedBy(entregador: Entregador): boolean {
    return entregador.status === StatusEntregador.ATIVO;
  }

  toString(): string {
    return 'Delivery driver is active';
  }
}

/**
 * Specification to check if delivery driver is available
 */
export class EntregadorDisponivelSpecification extends EntregadorSpecification {
  isSatisfiedBy(entregador: Entregador): boolean {
    return entregador.status === StatusEntregador.ATIVO &&
           entregador.disponibilidade === StatusDisponibilidade.DISPONIVEL;
  }

  toString(): string {
    return 'Delivery driver is available';
  }
}

/**
 * Specification to check if delivery driver is verified
 */
export class EntregadorVerificadoSpecification extends EntregadorSpecification {
  isSatisfiedBy(entregador: Entregador): boolean {
    return entregador.documentosVerificados === true;
  }

  toString(): string {
    return 'Delivery driver is verified';
  }
}

/**
 * Specification to check if delivery driver has minimum rating
 */
export class EntregadorTemAvaliacaoMinimaSpecification extends EntregadorSpecification {
  constructor(private readonly avaliacaoMinima: number = 4.0) {
    super();
  }

  isSatisfiedBy(entregador: Entregador): boolean {
    if (!entregador.avaliacaoMedia || entregador.totalAvaliacoes === 0) {
      return true; // New drivers without ratings are accepted
    }
    
    return entregador.avaliacaoMedia >= this.avaliacaoMinima;
  }

  toString(): string {
    return `Delivery driver has minimum rating of ${this.avaliacaoMinima}`;
  }
}

/**
 * Specification to check if delivery driver can accept new deliveries
 */
export class EntregadorPodeAceitarEntregasSpecification extends EntregadorSpecification {
  constructor(private readonly maxEntregasSimultaneas: number = 3) {
    super();
  }

  isSatisfiedBy(entregador: Entregador): boolean {
    const isAvailable = new EntregadorDisponivelSpecification().isSatisfiedBy(entregador);
    const isVerified = new EntregadorVerificadoSpecification().isSatisfiedBy(entregador);
    
    return isAvailable && 
           isVerified && 
           entregador.entregasAtivas < this.maxEntregasSimultaneas;
  }

  toString(): string {
    return `Delivery driver can accept new deliveries (max ${this.maxEntregasSimultaneas})`;
  }
}

/**
 * Specification to check if delivery driver has valid vehicle
 */
export class EntregadorTemVeiculoValidoSpecification extends EntregadorSpecification {
  isSatisfiedBy(entregador: Entregador): boolean {
    return entregador.tipoVeiculo !== null && 
           entregador.placaVeiculo !== null && 
           entregador.placaVeiculo.trim().length > 0;
  }

  toString(): string {
    return 'Delivery driver has valid vehicle';
  }
}

/**
 * Specification to check if delivery driver has specific vehicle type
 */
export class EntregadorTemTipoVeiculoSpecification extends EntregadorSpecification {
  constructor(private readonly tiposAceitos: TipoVeiculo[]) {
    super();
  }

  isSatisfiedBy(entregador: Entregador): boolean {
    return entregador.tipoVeiculo !== null && 
           this.tiposAceitos.includes(entregador.tipoVeiculo);
  }

  toString(): string {
    return `Delivery driver has vehicle type: ${this.tiposAceitos.join(', ')}`;
  }
}

/**
 * Specification to check if delivery driver location is recent
 */
export class EntregadorLocalizacaoRecenteSpecification extends EntregadorSpecification {
  constructor(private readonly maxMinutosAtras: number = 15) {
    super();
  }

  isSatisfiedBy(entregador: Entregador): boolean {
    if (!entregador.ultimaLocalizacao) {
      return false;
    }
    
    const limiteTempo = new Date();
    limiteTempo.setMinutes(limiteTempo.getMinutes() - this.maxMinutosAtras);
    
    return entregador.ultimaLocalizacao >= limiteTempo;
  }

  toString(): string {
    return `Delivery driver location is recent (within ${this.maxMinutosAtras} minutes)`;
  }
}

/**
 * Specification to check if delivery driver is experienced
 */
export class EntregadorExperienteSpecification extends EntregadorSpecification {
  constructor(
    private readonly minEntregasCompletas: number = 50,
    private readonly minAvaliacaoMedia: number = 4.5
  ) {
    super();
  }

  isSatisfiedBy(entregador: Entregador): boolean {
    return entregador.totalEntregasCompletas >= this.minEntregasCompletas &&
           (entregador.avaliacaoMedia || 0) >= this.minAvaliacaoMedia;
  }

  toString(): string {
    return `Delivery driver is experienced (${this.minEntregasCompletas}+ deliveries, ${this.minAvaliacaoMedia}+ rating)`;
  }
}

/**
 * Specification to check if delivery driver is within working hours
 */
export class EntregadorEmHorarioTrabalhoSpecification extends EntregadorSpecification {
  isSatisfiedBy(entregador: Entregador): boolean {
    if (!entregador.horarioInicioTrabalho || !entregador.horarioFimTrabalho) {
      return true; // No working hours restrictions
    }
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes since midnight
    
    const inicio = this.timeToMinutes(entregador.horarioInicioTrabalho);
    const fim = this.timeToMinutes(entregador.horarioFimTrabalho);
    
    // Handle overnight shifts
    if (inicio > fim) {
      return currentTime >= inicio || currentTime <= fim;
    }
    
    return currentTime >= inicio && currentTime <= fim;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  toString(): string {
    return 'Delivery driver is within working hours';
  }
}

/**
 * Specification to check if delivery driver needs break
 */
export class EntregadorPrecisaDescansoSpecification extends EntregadorSpecification {
  constructor(private readonly maxHorasConsecutivas: number = 8) {
    super();
  }

  isSatisfiedBy(entregador: Entregador): boolean {
    if (!entregador.inicioJornada) {
      return false;
    }
    
    const horasTrabalho = (Date.now() - entregador.inicioJornada.getTime()) / (1000 * 60 * 60);
    return horasTrabalho >= this.maxHorasConsecutivas;
  }

  toString(): string {
    return `Delivery driver needs break (${this.maxHorasConsecutivas}+ hours of work)`;
  }
}

/**
 * Specification to check if delivery driver is qualified for delivery type
 */
export class EntregadorQualificadoParaTipoEntregaSpecification extends EntregadorSpecification {
  constructor(
    private readonly requerVerificacao: boolean = false,
    private readonly avaliacaoMinima: number = 4.0,
    private readonly tiposVeiculoAceitos: TipoVeiculo[] = []
  ) {
    super();
  }

  isSatisfiedBy(entregador: Entregador): boolean {
    const isActive = new EntregadorAtivoSpecification().isSatisfiedBy(entregador);
    const hasMinRating = new EntregadorTemAvaliacaoMinimaSpecification(this.avaliacaoMinima).isSatisfiedBy(entregador);
    
    if (!isActive || !hasMinRating) {
      return false;
    }
    
    if (this.requerVerificacao) {
      const isVerified = new EntregadorVerificadoSpecification().isSatisfiedBy(entregador);
      if (!isVerified) return false;
    }
    
    if (this.tiposVeiculoAceitos.length > 0) {
      const hasValidVehicle = new EntregadorTemTipoVeiculoSpecification(this.tiposVeiculoAceitos).isSatisfiedBy(entregador);
      if (!hasValidVehicle) return false;
    }
    
    return true;
  }

  toString(): string {
    return `Delivery driver is qualified for delivery type (verification: ${this.requerVerificacao}, min rating: ${this.avaliacaoMinima})`;
  }
}
