import { DomainEvent } from '../events/domain-event.base';

/**
 * Classe base para entidades que precisam disparar eventos de domínio
 * Implementa o padrão Domain Events do DDD
 */
export abstract class AggregateRoot {
  private _domainEvents: DomainEvent[] = [];

  // Adicionar evento à lista
  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  // Obter todos os eventos
  public getDomainEvents(): ReadonlyArray<DomainEvent> {
    return [...this._domainEvents];
  }

  // Limpar eventos (geralmente após serem processados)
  public clearDomainEvents(): void {
    this._domainEvents = [];
  }

  // Verificar se há eventos pendentes
  public hasDomainEvents(): boolean {
    return this._domainEvents.length > 0;
  }

  // Remover evento específico
  protected removeDomainEvent(event: DomainEvent): void {
    const index = this._domainEvents.findIndex(e => e.equals(event));
    if (index !== -1) {
      this._domainEvents.splice(index, 1);
    }
  }

  // Obter eventos de um tipo específico
  public getDomainEventsOfType<T extends DomainEvent>(eventType: new (...args: any[]) => T): T[] {
    return this._domainEvents.filter(event => event instanceof eventType) as T[];
  }
}
