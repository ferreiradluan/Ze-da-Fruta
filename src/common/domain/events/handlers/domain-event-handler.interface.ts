import { IDomainEvent } from '../domain-event.base';

/**
 * Base interface for domain event handlers
 */
export interface IDomainEventHandler<T extends IDomainEvent = IDomainEvent> {
  handle(event: T): Promise<void>;
  canHandle(event: IDomainEvent): boolean;
}

/**
 * Base abstract class for domain event handlers
 */
export abstract class BaseDomainEventHandler<T extends IDomainEvent = IDomainEvent> 
  implements IDomainEventHandler<T> {
  
  protected abstract readonly eventType: string;

  abstract handle(event: T): Promise<void>;

  canHandle(event: IDomainEvent): boolean {
    return event.eventType === this.eventType;
  }

  /**
   * Logs event processing information
   */
  protected logEvent(event: IDomainEvent, message: string): void {
    console.log(`[${this.constructor.name}] ${message}`, {
      eventId: event.eventId,
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      occurredOn: event.occurredOn,
    });
  }

  /**
   * Handles errors during event processing
   */
  protected handleError(event: IDomainEvent, error: Error): void {
    console.error(`[${this.constructor.name}] Error processing event:`, {
      eventId: event.eventId,
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      error: error.message,
      stack: error.stack,
    });
  }
}

/**
 * Registry for domain event handlers
 */
export class DomainEventHandlerRegistry {
  private readonly handlers = new Map<string, IDomainEventHandler[]>();

  /**
   * Registers a handler for a specific event type
   */
  register<T extends IDomainEvent>(
    eventType: string,
    handler: IDomainEventHandler<T>
  ): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    
    this.handlers.get(eventType)!.push(handler);
  }

  /**
   * Gets all handlers for a specific event type
   */
  getHandlers(eventType: string): IDomainEventHandler[] {
    return this.handlers.get(eventType) || [];
  }

  /**
   * Unregisters a handler
   */
  unregister(eventType: string, handler: IDomainEventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Clears all handlers
   */
  clear(): void {
    this.handlers.clear();
  }
}
