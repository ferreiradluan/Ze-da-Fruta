/**
 * Classe base abstrata para todos os eventos de domínio
 * Seguindo padrões de Domain-Driven Design
 */
export abstract class DomainEvent {
  readonly occurredOn: Date = new Date();
  abstract readonly eventName: string;
  abstract readonly aggregateId: string;
  readonly version: number = 1;

  /**
   * Identificador único do evento
   */
  readonly eventId: string = this.generateEventId();

  private generateEventId(): string {
    // Gerar um ID único simples (em produção, usar UUID)
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Converte o evento para um objeto serializável
   */
  toJSON(): Record<string, any> {
    return {
      eventId: this.eventId,
      eventName: this.eventName,
      aggregateId: this.aggregateId,
      occurredOn: this.occurredOn.toISOString(),
      version: this.version,
      data: this.getData()
    };
  }

  /**
   * Dados específicos do evento (implementado pelas subclasses)
   */
  protected abstract getData(): Record<string, any>;
}
