/**
 * Base class para todos os eventos de domínio
 * Seguindo padrão DDD para eventos
 */
export abstract class DomainEvent {
  public readonly occurredOn: Date;
  public readonly eventId: string;
  public abstract readonly eventName: string;
  public abstract readonly version: number;

  constructor() {
    this.occurredOn = new Date();
    this.eventId = this.generateEventId();
  }

  // Serialização para persistência ou transmissão
  public toJSON(): object {
    return {
      eventId: this.eventId,
      eventName: this.eventName,
      version: this.version,
      occurredOn: this.occurredOn.toISOString(),
      data: this.getData()
    };
  }

  // Dados específicos do evento (implementado pelas subclasses)
  protected abstract getData(): object;

  // Geração de ID único para o evento
  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Comparação de eventos
  public equals(other: DomainEvent): boolean {
    return this.eventId === other.eventId;
  }

  // Validação de integridade do evento
  public isValid(): boolean {
    return Boolean(
      this.eventId &&
      this.eventName &&
      this.occurredOn &&
      this.version > 0
    );
  }
}
