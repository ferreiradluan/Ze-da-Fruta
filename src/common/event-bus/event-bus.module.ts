import { Module } from '@nestjs/common';
import { DomainEventRegistry } from '../domain/events/domain-event-registry';

/**
 * Module for event bus functionality
 * Provides domain event handling infrastructure
 */
@Module({
  providers: [
    DomainEventRegistry,
  ],
  exports: [
    DomainEventRegistry,
  ],
})
export class EventBusModule {}
