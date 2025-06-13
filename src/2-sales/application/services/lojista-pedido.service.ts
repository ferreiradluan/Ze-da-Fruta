import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Pedido } from '../../domain/entities/pedido.entity';
import { PedidoRepository } from '../../infrastructure/repositories/pedido.repository';
import { EstabelecimentoRepository } from '../../infrastructure/repositories/estabelecimento.repository';
import { StatusPedido } from '../../domain/enums/status-pedido.enum';

/**
 * LojistaPedidoService - Serviço para gerenciar pedidos do lojista
 * Separado do SalesService para manter conformidade com o diagrama DDD
 */
@Injectable()
export class LojistaPedidoService {
  constructor(
    private readonly pedidoRepository: PedidoRepository,
    private readonly estabelecimentoRepository: EstabelecimentoRepository,
  ) {}

  async listarPedidosDaLoja(lojistaId: string, status?: StatusPedido): Promise<Pedido[]> {
    // Buscar estabelecimento do lojista
    const estabelecimento = await this.estabelecimentoRepository.findByUsuario(lojistaId);
    if (!estabelecimento) {
      throw new ForbiddenException('Usuário não possui estabelecimento');
    }

    if (status) {
      return await this.pedidoRepository.findByEstabelecimentoAndStatus(estabelecimento.id, status);
    }

    return await this.pedidoRepository.findByEstabelecimento(estabelecimento.id);
  }

  async atualizarStatusPedidoLojista(lojistaId: string, pedidoId: string, novoStatus: StatusPedido): Promise<Pedido> {
    const estabelecimento = await this.estabelecimentoRepository.findByUsuario(lojistaId);
    if (!estabelecimento) {
      throw new ForbiddenException('Usuário não possui estabelecimento');
    }

    const pedido = await this.pedidoRepository.findById(pedidoId);
    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado');
    }

    // Verificar se o pedido pertence ao estabelecimento do lojista
    if (pedido.estabelecimentoId !== estabelecimento.id) {
      throw new ForbiddenException('Acesso negado ao pedido');
    }

    // Usar método do domínio rico para atualizar status
    pedido.atualizarStatus(novoStatus);

    return await this.pedidoRepository.save(pedido);
  }
}
