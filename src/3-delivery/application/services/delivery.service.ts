import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EntregaRepository } from '../../infrastructure/repositories/entrega.repository';
import { Entrega } from '../../domain/entities/entrega.entity';
import { StatusEntrega, StatusEntregaType, isValidStatusEntrega } from '../../domain/constants/status-entrega.constants';
import { EnderecoVO } from '../../domain/value-objects/endereco-vo';

/**
 * 🔧 FASE 3: DELIVERYSERVICE REFATORADO PARA ORQUESTRAÇÃO PURA
 * 
 * ✅ APENAS persistência e consultas
 * ✅ Lógica de negócio está na entidade Entrega
 * ✅ Usa métodos da entidade para mudanças de estado
 */
@Injectable()
export class DeliveryService {
  constructor(
    private readonly entregaRepository: EntregaRepository
  ) {}

  // ✅ MÉTODO 1 DO DIAGRAMA
  async buscarEntregasDisponiveis(): Promise<Entrega[]> {
    return await this.entregaRepository.findDisponiveis();
  }

  // ✅ MÉTODO 2 DO DIAGRAMA
  async aceitarEntrega(entregaId: string, entregadorId: string): Promise<Entrega> {
    const entrega = await this.entregaRepository.findById(entregaId);
    
    if (!entrega) {
      throw new NotFoundException('Entrega não encontrada');
    }

    // Usar método do domínio rico
    entrega.aceitar(entregadorId);
    
    return await this.entregaRepository.save(entrega);
  }

  // ✅ MÉTODO 3 DO DIAGRAMA
  async atualizarStatusEntrega(entregaId: string, entregadorId: string, novoStatus: StatusEntregaType): Promise<Entrega> {
    // Validar status
    if (!isValidStatusEntrega(novoStatus)) {
      throw new BadRequestException(`Status inválido: ${novoStatus}`);
    }

    const entrega = await this.entregaRepository.findById(entregaId);
    
    if (!entrega) {
      throw new NotFoundException('Entrega não encontrada');
    }

    if (entrega.entregadorId !== entregadorId) {
      throw new BadRequestException('Entrega não pertence a este entregador');
    }

    // Usar métodos do domínio rico baseado no status
    switch (novoStatus) {
      case StatusEntrega.COLETADO:
        entrega.marcarComoColetado();
        break;
      case StatusEntrega.ENTREGUE:
        entrega.marcarComoEntregue();
        break;
      case StatusEntrega.CANCELADA:
        entrega.cancelar();
        break;
      default:
        throw new BadRequestException('Transição de status inválida');
    }

    return await this.entregaRepository.save(entrega);
  }

  // ✅ MÉTODO 4 DO DIAGRAMA
  async obterStatusEntrega(pedidoId: string): Promise<Entrega | null> {
    return await this.entregaRepository.findByPedidoId(pedidoId);
  }

  // ✅ LISTENER PARA CRIAR ENTREGA QUANDO PEDIDO É CONFIRMADO
  @OnEvent('pedido.confirmado')
  async criarEntregaParaPedido(evento: { 
    pedidoId: string; 
    enderecoEntrega: any;
    enderecoColeta?: any;
  }) {
    const entrega = new Entrega();
    entrega.pedidoId = evento.pedidoId;
    entrega.status = StatusEntrega.AGUARDANDO_ACEITE;
    
    // Configurar endereços usando Value Objects
    if (evento.enderecoEntrega) {
      const enderecoEntrega = new EnderecoVO(
        evento.enderecoEntrega.rua,
        evento.enderecoEntrega.numero,
        evento.enderecoEntrega.cidade,
        evento.enderecoEntrega.cep
      );
      entrega.setEnderecoEntrega(enderecoEntrega);
    }

    if (evento.enderecoColeta) {
      const enderecoColeta = new EnderecoVO(
        evento.enderecoColeta.rua,
        evento.enderecoColeta.numero,
        evento.enderecoColeta.cidade,
        evento.enderecoColeta.cep
      );
      entrega.setEnderecoColeta(enderecoColeta);
    }
    
    await this.entregaRepository.save(entrega);
  }
}