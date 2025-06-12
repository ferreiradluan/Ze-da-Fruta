import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pedido } from '../../../2-sales/domain/entities/pedido.entity';
import { StatusPedido } from '../../../2-sales/domain/enums/status-pedido.enum';
import { EventoPagamento } from './event-bus.service';
import { EstoqueService } from './estoque.service';

@Injectable()
export class PedidoEventHandler {
  constructor(
    @InjectRepository(Pedido)
    private readonly pedidoRepository: Repository<Pedido>,
    private readonly estoqueService: EstoqueService
  ) {}
  /**
   * Trata evento de pagamento aprovado
   * Transição: PAGAMENTO_PENDENTE → PAGO → PREPARANDO
   */
  async handlePagamentoAprovado(evento: EventoPagamento): Promise<void> {
    try {
      const pedido = await this.pedidoRepository.findOne({ where: { id: evento.pedidoId } });
      
      if (!pedido) {
        console.error(`Pedido ${evento.pedidoId} não encontrado`);
        return;
      }

      // Verificar se o pedido está no status correto
      if (pedido.status !== StatusPedido.PAGAMENTO_PENDENTE) {
        console.warn(`Pedido ${evento.pedidoId} não está em PAGAMENTO_PENDENTE (status atual: ${pedido.status})`);
        return;
      }

      // 1. Atualizar status para PAGO
      pedido.status = StatusPedido.PAGO;
      await this.pedidoRepository.save(pedido);

      // 2. Reservar estoque definitivamente
      await this.estoqueService.reservarEstoque(evento.pedidoId);

      // 3. Aguardar um momento e depois mover para PREPARANDO
      setTimeout(async () => {
        try {
          const pedidoAtualizado = await this.pedidoRepository.findOne({ where: { id: evento.pedidoId } });
          if (pedidoAtualizado && pedidoAtualizado.status === StatusPedido.PAGO) {
            pedidoAtualizado.status = StatusPedido.EM_PREPARO;
            await this.pedidoRepository.save(pedidoAtualizado);
            console.log(`Pedido ${evento.pedidoId} movido para EM_PREPARO`);
          }
        } catch (error) {
          console.error(`Erro ao mover pedido ${evento.pedidoId} para EM_PREPARO:`, error);
        }
      }, 2000); // 2 segundos de delay

      console.log(`Pagamento aprovado para pedido ${evento.pedidoId}, status atualizado para PAGO`);
    } catch (error) {
      console.error(`Erro ao processar pagamento aprovado para pedido ${evento.pedidoId}:`, error);
    }
  }
  /**
   * Trata evento de pagamento recusado
   * Transição: PAGAMENTO_PENDENTE → CANCELADO
   */
  async handlePagamentoRecusado(evento: EventoPagamento): Promise<void> {
    try {
      const pedido = await this.pedidoRepository.findOne({ where: { id: evento.pedidoId } });
      
      if (!pedido) {
        console.error(`Pedido ${evento.pedidoId} não encontrado`);
        return;
      }

      // Verificar se o pedido está no status correto
      if (pedido.status !== StatusPedido.PAGAMENTO_PENDENTE) {
        console.warn(`Pedido ${evento.pedidoId} não está em PAGAMENTO_PENDENTE (status atual: ${pedido.status})`);
        return;
      }

      // Atualizar status para CANCELADO
      pedido.status = StatusPedido.CANCELADO;
      await this.pedidoRepository.save(pedido);

      // Não precisamos liberar estoque pois nunca foi reservado para pagamentos pendentes
      
      console.log(`Pagamento recusado para pedido ${evento.pedidoId}, status atualizado para CANCELADO`);
    } catch (error) {
      console.error(`Erro ao processar pagamento recusado para pedido ${evento.pedidoId}:`, error);
    }
  }
  /**
   * Trata evento de pagamento estornado
   * Transição: PAGO/EM_PREPARO/ENVIADO → CANCELADO + liberação de estoque
   */
  async handlePagamentoEstornado(evento: EventoPagamento): Promise<void> {
    try {
      const pedido = await this.pedidoRepository.findOne({ where: { id: evento.pedidoId } });
      
      if (!pedido) {
        console.error(`Pedido ${evento.pedidoId} não encontrado`);
        return;
      }

      // Verificar se o pedido pode ser cancelado
      if (pedido.status === StatusPedido.ENTREGUE) {
        console.warn(`Pedido ${evento.pedidoId} já foi entregue, não pode ser cancelado por estorno`);
        return;
      }

      if (pedido.status === StatusPedido.CANCELADO) {
        console.warn(`Pedido ${evento.pedidoId} já está cancelado`);
        return;
      }

      // Liberar estoque se necessário
      if ([StatusPedido.PAGO, StatusPedido.EM_PREPARO, StatusPedido.ENVIADO].includes(pedido.status)) {
        await this.estoqueService.liberarEstoque(evento.pedidoId);
      }

      // Atualizar status para CANCELADO
      pedido.status = StatusPedido.CANCELADO;
      await this.pedidoRepository.save(pedido);

      console.log(`Pagamento estornado para pedido ${evento.pedidoId}, status atualizado para CANCELADO e estoque liberado`);
    } catch (error) {
      console.error(`Erro ao processar pagamento estornado para pedido ${evento.pedidoId}:`, error);
    }
  }
}
