import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventBusService } from './event-bus.service';

/**
 * Módulo Event Bus
 * 
 * Este módulo configura o barramento de eventos para comunicação 
 * assíncrona entre domínios da aplicação.
 * 
 * Funcionalidades:
 * - Comunicação assíncrona entre módulos
 * - Desacoplamento de domínios
 * - Sistema de eventos global
 */
@Module({
  imports: [
    EventEmitterModule.forRoot({
      // Set this to `true` to use wildcards
      wildcard: false,
      // The delimiter used to segment namespaces
      delimiter: '.',
      // Set this to `true` if you want to emit the newListener event
      newListener: false,
      // Set this to `true` if you want to emit the removeListener event
      removeListener: false,
      // The maximum amount of listeners that can be assigned to an event
      maxListeners: 10,
      // Show event name in memory leak message when more than maximum amount of listeners is assigned
      verboseMemoryLeak: false,
      // Disable throwing uncaughtException if an error event is emitted and it has no listeners
      ignoreErrors: false,
    }),
  ],
  providers: [EventBusService],
  exports: [EventEmitterModule, EventBusService],
})
export class EventBusModule {}
