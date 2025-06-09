import { Injectable, NotFoundException, ForbiddenException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { Entregador, StatusEntregador, StatusDisponibilidade } from '../../domain/entities/entregador.entity';
import { Entrega } from '../../domain/entities/entrega.entity';
import { StatusEntrega } from '../../domain/enums/status-entrega.enum';
import { EnderecoVO } from '../../domain/value-objects/endereco.vo';
import { EntregaRepository } from '../../infrastructure/repositories/entrega.repository';
import { EventBusService } from '../../../common/event-bus';
import { PedidoConfirmadoEvent } from '../../../2-sales/domain/events';

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);
  
  constructor(
    @InjectRepository(Entregador)
    private readonly entregadorRepository: Repository<Entregador>,
    @InjectRepository(Entrega)
    private readonly entregaTypeOrmRepository: Repository<Entrega>,
    private readonly entregaRepository: EntregaRepository,
    private readonly eventBusService: EventBusService,
  ) {}

  // ===== MÉTODOS PARA GERENCIAMENTO DE IMAGENS =====

  async updateDeliveryDriverProfilePhoto(user: any, driverId: string, photoUrl: string): Promise<void> {
    try {
      // Verifica se o usuário tem permissão (admin ou o próprio entregador)
      if (!user.roles.includes('ADMIN') && user.entregadorId !== driverId) {
        throw new ForbiddenException('Você não tem permissão para alterar a foto deste entregador');
      }

      const entregador = await this.entregadorRepository.findOne({ where: { id: driverId } });
      if (!entregador) {
        throw new NotFoundException('Entregador não encontrado');
      }
      
      entregador.fotoPerfil = photoUrl;
      await this.entregadorRepository.save(entregador);
      
      this.logger.log(`Foto de perfil atualizada para entregador ${driverId}: ${photoUrl}`);
    } catch (err) {
      this.logger.error('Erro ao atualizar foto de perfil do entregador', err);
      throw new InternalServerErrorException('Erro ao atualizar foto de perfil: ' + (err?.message || err));
    }
  }

  async deleteDeliveryDriverProfilePhoto(user: any, driverId: string): Promise<void> {
    try {
      // Verifica se o usuário tem permissão (admin ou o próprio entregador)
      if (!user.roles.includes('ADMIN') && user.entregadorId !== driverId) {
        throw new ForbiddenException('Você não tem permissão para remover a foto deste entregador');
      }

      const entregador = await this.entregadorRepository.findOne({ where: { id: driverId } });
      if (!entregador) {
        throw new NotFoundException('Entregador não encontrado');
      }
      
      entregador.fotoPerfil = null;
      await this.entregadorRepository.save(entregador);
      
      this.logger.log(`Foto de perfil removida para entregador ${driverId}`);
    } catch (err) {
      this.logger.error('Erro ao remover foto de perfil do entregador', err);
      throw new InternalServerErrorException('Erro ao remover foto de perfil: ' + (err?.message || err));
    }
  }

  // ===== MÉTODOS BÁSICOS DE ENTREGADOR =====

  async findById(id: string): Promise<Entregador> {
    const entregador = await this.entregadorRepository.findOne({ where: { id } });
    if (!entregador) {
      throw new NotFoundException('Entregador não encontrado');
    }
    return entregador;
  }

  async findAll(): Promise<Entregador[]> {
    return this.entregadorRepository.find({
      order: { createdAt: 'DESC' }
    });
  }

  async create(entregadorData: Partial<Entregador>): Promise<Entregador> {
    const entregador = this.entregadorRepository.create(entregadorData);
    return this.entregadorRepository.save(entregador);
  }

  async update(id: string, entregadorData: Partial<Entregador>): Promise<Entregador> {
    const entregador = await this.findById(id);
    Object.assign(entregador, entregadorData);
    return this.entregadorRepository.save(entregador);
  }
  async delete(id: string): Promise<void> {
    const entregador = await this.findById(id);
    await this.entregadorRepository.remove(entregador);
  }  // ===== MÉTODOS PARA ENTREGADORES =====

  /**
   * Busca entregas disponíveis para aceite
   */
  async buscarEntregasDisponiveis(): Promise<Entrega[]> {
    try {
      this.logger.log('🔍 Buscando entregas disponíveis para aceite');
      
      // Buscar entregas com status AGUARDANDO_ACEITE
      const entregasDisponiveis = await this.entregaRepository.buscarPorStatus(StatusEntrega.AGUARDANDO_ACEITE);
      
      this.logger.log(`📋 Encontradas ${entregasDisponiveis.length} entregas disponíveis`);
      return entregasDisponiveis;
      
    } catch (error) {
      this.logger.error('❌ Erro ao buscar entregas disponíveis:', error);
      throw new InternalServerErrorException('Erro ao buscar entregas disponíveis');
    }
  }

  /**
   * Aceita uma entrega específica pelo entregador
   */
  async aceitarEntrega(entregaId: string, entregadorId: string): Promise<Entrega> {
    try {
      this.logger.log(`🤝 Entregador ${entregadorId} tentando aceitar entrega ${entregaId}`);
      
      // Buscar a entrega
      const entrega = await this.entregaRepository.buscarPorId(entregaId);
      if (!entrega) {
        throw new NotFoundException('Entrega não encontrada');
      }

      // Verificar se a entrega está disponível para aceite
      if (entrega.status !== StatusEntrega.AGUARDANDO_ACEITE) {
        throw new ForbiddenException('Esta entrega não está mais disponível para aceite');
      }

      // Verificar se o entregador existe e está disponível
      const entregador = await this.entregadorRepository.findOne({ 
        where: { 
          id: entregadorId,
          status: StatusEntregador.ATIVO,
          disponibilidade: StatusDisponibilidade.DISPONIVEL
        }
      });

      if (!entregador) {
        throw new ForbiddenException('Entregador não está disponível para aceitar entregas');
      }

      // Atribuir entregador e atualizar status (proteção contra race condition)
      entrega.entregadorId = entregadorId;
      entrega.status = StatusEntrega.PENDENTE;
      
      const entregaAtualizada = await this.entregaRepository.atualizar(entrega);
      
      this.logger.log(`✅ Entrega ${entregaId} aceita pelo entregador ${entregadorId}`);

      // Emitir evento de entrega aceita
      await this.eventBusService.emit({
        eventName: 'entrega.aceita',
        payload: {
          entregaId: entrega.id,
          entregadorId: entregadorId,
          entregadorNome: entregador.nome,
          pedidoId: entrega.pedidoId,
          status: entrega.status
        },
        timestamp: new Date(),
        aggregateId: entrega.id
      });

      return entregaAtualizada;
      
    } catch (error) {
      this.logger.error(`❌ Erro ao aceitar entrega ${entregaId}:`, error);
      
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Erro interno ao aceitar entrega');
    }
  }

  // ===== EVENT HANDLERS =====

  /**
   * Handler: Cria entrega quando pedido é confirmado
   * Este método é chamado automaticamente quando o evento 'pedido.confirmado' é emitido
   */
  @OnEvent('pedido.confirmado')
  async handlePedidoConfirmado(pedidoConfirmadoEvent: PedidoConfirmadoEvent): Promise<void> {
    try {
      this.logger.log(`🚚 Iniciando processo de entrega para pedido ${pedidoConfirmadoEvent.pedidoId}`);

      // Receber os dados do pedido do payload
      const { pedidoId, clienteId, valor, enderecoEntrega, itens } = pedidoConfirmadoEvent;

      // Buscar informações adicionais se necessário
      // Simular endereço da loja/estabelecimento (em um caso real, buscaria do banco)
      const enderecoColeta = new EnderecoVO(
        'Rua do Estabelecimento',
        '123',
        'Centro',
        'São Paulo',
        'SP',
        '01234-567',
        'Loja Principal'
      );

      // Converter endereço de entrega de string para EnderecoVO
      let enderecoEntregaVO: EnderecoVO;
      if (enderecoEntrega) {
        try {
          enderecoEntregaVO = EnderecoVO.fromString(enderecoEntrega);
        } catch (error) {
          // Se não conseguir fazer parse, criar um endereço padrão
          enderecoEntregaVO = new EnderecoVO(
            enderecoEntrega,
            'S/N',
            'Bairro',
            'Cidade',
            'SP',
            '00000-000'
          );
        }
      } else {
        throw new Error('Endereço de entrega não fornecido');
      }

      // Criar uma nova instância da entidade Entrega
      const novaEntrega = Entrega.criar(
        pedidoId,
        enderecoColeta,
        enderecoEntregaVO,
        this.calcularValorFrete(enderecoEntregaVO)
      );

      // Preencher dados adicionais da Entrega
      novaEntrega.status = StatusEntrega.AGUARDANDO_ACEITE;
      novaEntrega.observacoes = `Pedido confirmado - Cliente: ${clienteId} - Valor: R$ ${valor.toFixed(2)}`;
      
      // Buscar entregador disponível
      const entregadorDisponivel = await this.buscarEntregadorDisponivel();
      if (entregadorDisponivel) {
        novaEntrega.entregadorId = entregadorDisponivel.id;
        novaEntrega.status = StatusEntrega.PENDENTE;
        this.logger.log(`📋 Entregador ${entregadorDisponivel.nome} atribuído à entrega`);
      } else {
        this.logger.warn(`⚠️ Nenhum entregador disponível para pedido ${pedidoId}`);
      }

      // Salvar a nova entidade Entrega no banco usando o EntregaRepository
      const entregaSalva = await this.entregaRepository.criar(novaEntrega);

      this.logger.log(`✅ Entrega ${entregaSalva.id} criada com sucesso para pedido ${pedidoId}`);

      // Emitir evento de entrega criada para outros módulos
      await this.eventBusService.emit({
        eventName: 'entrega.criada',
        payload: {
          entregaId: entregaSalva.id,
          pedidoId: pedidoId,
          entregadorId: entregaSalva.entregadorId,
          status: entregaSalva.status,
          previsaoEntrega: entregaSalva.previsaoEntrega,
          enderecoEntrega: enderecoEntregaVO.toString(),
          valorFrete: entregaSalva.valorFrete
        },
        timestamp: new Date(),
        aggregateId: entregaSalva.id
      });

      // Notificar entregador se foi atribuído
      if (entregadorDisponivel) {
        await this.notificarEntregadorNovaEntrega(entregadorDisponivel.id, entregaSalva);
      }

    } catch (error) {
      this.logger.error(`❌ Erro ao processar pedido confirmado ${pedidoConfirmadoEvent.pedidoId}:`, error);
      
      // Emitir evento de erro na criação da entrega
      await this.eventBusService.emit({
        eventName: 'entrega.erro_criacao',
        payload: {
          pedidoId: pedidoConfirmadoEvent.pedidoId,
          erro: error.message,
          timestamp: new Date()
        },
        timestamp: new Date(),
        aggregateId: pedidoConfirmadoEvent.pedidoId
      });
      
      // Re-throw para que o erro seja logado pelo NestJS
      throw error;
    }
  }

  // ===== MÉTODOS AUXILIARES =====

  /**
   * Calcula valor do frete baseado no endereço de entrega
   */
  private calcularValorFrete(enderecoEntrega: EnderecoVO): number {
    // Simular cálculo de frete baseado na distância
    // Em uma implementação real, você usaria APIs como Google Maps ou cálculos de distância
    const basePrice = 5.00; // Taxa base de R$ 5,00
    const distanceMultiplier = Math.random() * 10; // Simular distância (0-10 km)
    const perKmRate = 1.50; // R$ 1,50 por km
    
    const freteCalculado = basePrice + (distanceMultiplier * perKmRate);
    
    this.logger.log(`💰 Frete calculado: R$ ${freteCalculado.toFixed(2)} para ${enderecoEntrega.toString()}`);
    
    return Math.round(freteCalculado * 100) / 100; // Arredondar para 2 casas decimais
  }

  /**
   * Busca entregador disponível na região
   */
  private async buscarEntregadorDisponivel(): Promise<Entregador | null> {
    try {
      // Buscar entregadores ativos e disponíveis
      const entregadores = await this.entregadorRepository.find({
        where: { 
          status: StatusEntregador.ATIVO,
          disponibilidade: StatusDisponibilidade.DISPONIVEL 
        },
        take: 1,
        order: { createdAt: 'ASC' } // Primeiro a entrar, primeiro a ser atribuído
      });

      if (entregadores.length > 0) {
        const entregador = entregadores[0];
        this.logger.log(`👤 Entregador encontrado: ${entregador.nome} (${entregador.id})`);
        return entregador;
      } else {
        this.logger.warn('⚠️ Nenhum entregador disponível no momento');
        return null;
      }
    } catch (error) {
      this.logger.error('❌ Erro ao buscar entregador disponível:', error);
      return null;
    }
  }

  /**
   * Notifica entregador sobre nova entrega disponível
   */
  private async notificarEntregadorNovaEntrega(entregadorId: string, entrega: Entrega): Promise<void> {
    try {
      // Emitir evento para o módulo de notificações
      await this.eventBusService.emit({
        eventName: 'notificacao.enviar',
        payload: {
          tipo: 'NOVA_ENTREGA_DISPONIVEL',
          destinatario: entregadorId,
          titulo: 'Nova entrega disponível! 🚚',
          mensagem: `Nova entrega #${entrega.id} está disponível para ${entrega.enderecoEntrega.toString()}`,
          dados: {
            entregaId: entrega.id,
            pedidoId: entrega.pedidoId,
            enderecoEntrega: entrega.enderecoEntrega.toString(),
            valorFrete: entrega.valorFrete,
            previsaoEntrega: entrega.previsaoEntrega
          }
        },
        timestamp: new Date(),
        aggregateId: entrega.id
      });

      this.logger.log(`📢 Notificação enviada para entregador ${entregadorId} sobre entrega ${entrega.id}`);
    } catch (error) {
      this.logger.error(`❌ Erro ao notificar entregador ${entregadorId}:`, error);
    }
  }
}
