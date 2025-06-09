import { IDomainEvent } from './events/domain-event.base';

/**
 * Base aggregate root interface
 */
export interface IAggregateRoot {
  readonly id: string;
  readonly domainEvents: IDomainEvent[];
  addDomainEvent(event: IDomainEvent): void;
  clearDomainEvents(): void;
  markEventsAsDispatched(): void;
}

/**
 * Base aggregate root implementation using composition pattern
 */
export class AggregateRoot implements IAggregateRoot {
  private _domainEvents: IDomainEvent[] = [];
  private _eventVersion: number = 1;

  constructor(
    public readonly id: string
  ) {}

  get domainEvents(): IDomainEvent[] {
    return [...this._domainEvents];
  }

  get eventVersion(): number {
    return this._eventVersion;
  }

  addDomainEvent(event: IDomainEvent): void {
    this._domainEvents.push(event);
    this._eventVersion++;
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  markEventsAsDispatched(): void {
    this.clearDomainEvents();
  }

  /**
   * Gets uncommitted events (events that haven't been dispatched yet)
   */
  getUncommittedEvents(): IDomainEvent[] {
    return this.domainEvents;
  }

  /**
   * Marks events as committed (dispatched)
   */
  markEventsAsCommitted(): void {
    this.clearDomainEvents();
  }
}
