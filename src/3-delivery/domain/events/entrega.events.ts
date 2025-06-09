import { DomainEvent } from '../../../common/domain/events/domain-event.base';
import { StatusEntrega } from '../enums/status-entrega.enum';
import { EnderecoVO } from '../value-objects/endereco.vo';

/**
 * Domain Events for Entrega Entity
 */

export class EntregaCriadaEvent extends DomainEvent {
  constructor(
    public readonly entregaId: string,
    public readonly pedidoId: string,
    public readonly enderecoColeta: EnderecoVO,
    public readonly enderecoEntrega: EnderecoVO,
    public readonly valorFrete: number,
    public readonly previsaoEntrega: Date
  ) {
    super(entregaId);
  }

  getEventName(): string {
    return 'EntregaCriada';
  }

  protected getPayload(): Record<string, any> {
    return {
      entregaId: this.entregaId,
      pedidoId: this.pedidoId,
      enderecoColeta: this.enderecoColeta.toString(),
      enderecoEntrega: this.enderecoEntrega.toString(),
      valorFrete: this.valorFrete,
      previsaoEntrega: this.previsaoEntrega.toISOString(),
      dataCriacao: this.occurredOn.toISOString()
    };
  }
}

export class EntregaAceitaEvent extends DomainEvent {
  constructor(
    public readonly entregaId: string,
    public readonly entregadorId: string,
    public readonly pedidoId: string,
    public readonly enderecoEntrega: EnderecoVO
  ) {
    super(entregaId);
  }

  getEventName(): string {
    return 'EntregaAceita';
  }

  protected getPayload(): Record<string, any> {
    return {
      entregaId: this.entregaId,
      entregadorId: this.entregadorId,
      pedidoId: this.pedidoId,
      enderecoEntrega: this.enderecoEntrega.toString(),
      dataAceite: this.occurredOn.toISOString()
    };
  }
}

export class EntregaIniciadaEvent extends DomainEvent {
  constructor(
    public readonly entregaId: string,
    public readonly entregadorId: string,
    public readonly pedidoId: string,
    public readonly dataRetirada: Date
  ) {
    super(entregaId);
  }

  getEventName(): string {
    return 'EntregaIniciada';
  }

  protected getPayload(): Record<string, any> {
    return {
      entregaId: this.entregaId,
      entregadorId: this.entregadorId,
      pedidoId: this.pedidoId,
      dataRetirada: this.dataRetirada.toISOString(),
      dataEvento: this.occurredOn.toISOString()
    };
  }
}

export class EntregaFinalizadaEvent extends DomainEvent {
  constructor(
    public readonly entregaId: string,
    public readonly entregadorId: string,
    public readonly pedidoId: string,
    public readonly dataEntrega: Date,
    public readonly tempoTotal: number // em minutos
  ) {
    super(entregaId);
  }

  getEventName(): string {
    return 'EntregaFinalizada';
  }

  protected getPayload(): Record<string, any> {
    return {
      entregaId: this.entregaId,
      entregadorId: this.entregadorId,
      pedidoId: this.pedidoId,
      dataEntrega: this.dataEntrega.toISOString(),
      tempoTotal: this.tempoTotal,
      dataEvento: this.occurredOn.toISOString()
    };
  }
}

export class EntregaCanceladaEvent extends DomainEvent {
  constructor(
    public readonly entregaId: string,
    public readonly pedidoId: string,
    public readonly entregadorId: string | null,
    public readonly motivo: string,
    public readonly statusAnterior: StatusEntrega
  ) {
    super(entregaId);
  }

  getEventName(): string {
    return 'EntregaCancelada';
  }

  protected getPayload(): Record<string, any> {
    return {
      entregaId: this.entregaId,
      pedidoId: this.pedidoId,
      entregadorId: this.entregadorId,
      motivo: this.motivo,
      statusAnterior: this.statusAnterior,
      dataCancelamento: this.occurredOn.toISOString()
    };
  }
}

export class StatusEntregaAlteradoEvent extends DomainEvent {
  constructor(
    public readonly entregaId: string,
    public readonly statusAnterior: StatusEntrega,
    public readonly novoStatus: StatusEntrega,
    public readonly entregadorId: string | null
  ) {
    super(entregaId);
  }

  getEventName(): string {
    return 'StatusEntregaAlterado';
  }

  protected getPayload(): Record<string, any> {
    return {
      entregaId: this.entregaId,
      statusAnterior: this.statusAnterior,
      novoStatus: this.novoStatus,
      entregadorId: this.entregadorId,
      dataAlteracao: this.occurredOn.toISOString()
    };
  }
}
