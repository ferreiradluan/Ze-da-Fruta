import { Injectable } from '@nestjs/common';
import { StatusPedido } from '../../../2-sales/domain/enums/status-pedido.enum';

export interface EventoPagamento {
  tipo: 'PAGAMENTO_APROVADO' | 'PAGAMENTO_RECUSADO' | 'PAGAMENTO_ESTORNADO';
  pedidoId: string;
  pagamentoId: string;
  valor: number;
  timestamp: Date;
  metadata?: any;
}

@Injectable()
export class EventBusService {
  private handlers: Map<string, Array<(evento: EventoPagamento) => Promise<void>>> = new Map();

  registrarHandler(tipoEvento: string, handler: (evento: EventoPagamento) => Promise<void>): void {
    if (!this.handlers.has(tipoEvento)) {
      this.handlers.set(tipoEvento, []);
    }
    this.handlers.get(tipoEvento)!.push(handler);
  }

  async publicarEvento(evento: EventoPagamento): Promise<void> {
    const handlers = this.handlers.get(evento.tipo) || [];
    
    // Executar todos os handlers em paralelo
    await Promise.all(
      handlers.map(handler => 
        handler(evento).catch(error => 
          console.error(`Erro ao processar evento ${evento.tipo}:`, error)
        )
      )
    );
  }
}
