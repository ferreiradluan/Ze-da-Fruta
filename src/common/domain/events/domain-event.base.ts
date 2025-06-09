/**
 * Base interface for all domain events
 */
export interface IDomainEvent {
  readonly eventId: string;
  readonly aggregateId: string;
  readonly aggregateType: string;
  readonly eventType: string;
  readonly occurredOn: Date;
  readonly eventVersion: number;
  readonly payload: Record<string, any>;
}

/**
 * Base class for domain events
 */
export abstract class BaseDomainEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly aggregateId: string;
  public readonly aggregateType: string;
  public readonly eventType: string;
  public readonly occurredOn: Date;
  public readonly eventVersion: number;
  public readonly payload: Record<string, any>;

  constructor(
    aggregateId: string,
    aggregateType: string,
    eventType: string,
    payload: Record<string, any> = {},
    eventVersion: number = 1
  ) {
    this.eventId = this.generateEventId();
    this.aggregateId = aggregateId;
    this.aggregateType = aggregateType;
    this.eventType = eventType;
    this.occurredOn = new Date();
    this.eventVersion = eventVersion;
    this.payload = Object.freeze({ ...payload });
  }

  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  /**
   * Returns a serializable representation of the event
   */
  toJSON(): Record<string, any> {
    return {
      eventId: this.eventId,
      aggregateId: this.aggregateId,
      aggregateType: this.aggregateType,
      eventType: this.eventType,
      occurredOn: this.occurredOn.toISOString(),
      eventVersion: this.eventVersion,
      payload: this.payload,
    };
  }
}

/**
 * Simplified domain event class for easier usage
 */
export class DomainEvent extends BaseDomainEvent {
  constructor(aggregateId?: string, eventType?: string, payload?: Record<string, any>) {
    super(
      aggregateId || 'unknown',
      'unknown',
      eventType || 'DomainEvent',
      payload
    );
  }

  getEventName(): string {
    return this.eventType;
  }
}

/**
 * Domain event dispatcher interface
 */
export interface IDomainEventDispatcher {
  dispatch(event: IDomainEvent): Promise<void>;
  dispatchAll(events: IDomainEvent[]): Promise<void>;
  subscribe<T extends IDomainEvent>(
    eventType: string,
    handler: (event: T) => Promise<void>
  ): void;
  unsubscribe(eventType: string, handler: Function): void;
}

/**
 * In-memory domain event dispatcher implementation
 */
export class DomainEventDispatcher implements IDomainEventDispatcher {
  private readonly eventHandlers = new Map<string, Function[]>();

  async dispatch(event: IDomainEvent): Promise<void> {
    const handlers = this.eventHandlers.get(event.eventType) || [];
    
    await Promise.all(
      handlers.map(async (handler) => {
        try {
          await handler(event);
        } catch (error) {
          console.error(`Error handling event ${event.eventType}:`, error);
          // In production, you might want to use a proper logging service
        }
      })
    );
  }

  async dispatchAll(events: IDomainEvent[]): Promise<void> {
    await Promise.all(events.map(event => this.dispatch(event)));
  }

  subscribe<T extends IDomainEvent>(
    eventType: string,
    handler: (event: T) => Promise<void>
  ): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    
    this.eventHandlers.get(eventType)!.push(handler);
  }

  unsubscribe(eventType: string, handler: Function): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Clears all event handlers (useful for testing)
   */
  clear(): void {
    this.eventHandlers.clear();
  }

  /**
   * Gets the number of handlers for an event type
   */
  getHandlerCount(eventType: string): number {
    return this.eventHandlers.get(eventType)?.length || 0;
  }
}
