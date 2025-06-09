import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { StatusEntrega } from '../enums/status-entrega.enum';
import { EnderecoVO } from '../value-objects/endereco.vo';
import { 
  EntregaInvalidaError,
  TransicaoStatusEntregaInvalidaError,
  EntregaSemEntregadorError,
  EntregaNaoPodeSerCanceladaError,
  ValorFreteInvalidoError,
  PrevisaoEntregaInvalidaError,
  EntregaJaFinalizadaError
} from '../errors/entrega.errors';
import { 
  EntregaCriadaEvent,
  EntregaAceitaEvent, 
  EntregaIniciadaEvent,
  EntregaFinalizadaEvent,
  EntregaCanceladaEvent,
  StatusEntregaAlteradoEvent
} from '../events/entrega.events';
import { DomainEvent } from '../../../common/domain/events/domain-event.base';

@Entity('entregas')
export class Entrega {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  pedidoId: string;
  @Column({ nullable: true })
  entregadorId: string | null;

  @Column({
    type: 'varchar',
    enum: StatusEntrega,
    default: StatusEntrega.PENDENTE
  })
  status: StatusEntrega;

  @Column('json', { nullable: true })
  enderecoColeta: EnderecoVO | null;

  @Column('json', { nullable: true })
  enderecoEntrega: EnderecoVO | null;

  @Column({ nullable: true })
  observacoes: string | null;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  valorFrete: number;

  @Column({ type: 'datetime', nullable: true })
  previsaoEntrega: Date;

  @Column({ type: 'datetime', nullable: true })
  dataRetirada: Date;

  @Column({ type: 'datetime', nullable: true })
  dataEntrega: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Domain events storage
  private _domainEvents: DomainEvent[] = [];

  // ===== BUSINESS METHODS =====

  /**
   * Valida dados básicos da entrega
   */
  private validar(): void {
    if (!this.pedidoId?.trim()) {
      throw new EntregaInvalidaError('ID do pedido é obrigatório');
    }

    if (!this.enderecoColeta) {
      throw new EntregaInvalidaError('Endereço de coleta é obrigatório');
    }

    if (!this.enderecoEntrega) {
      throw new EntregaInvalidaError('Endereço de entrega é obrigatório');
    }

    if (this.valorFrete !== undefined && this.valorFrete < 0) {
      throw new ValorFreteInvalidoError(this.valorFrete);
    }

    if (this.previsaoEntrega && this.previsaoEntrega <= new Date()) {
      throw new PrevisaoEntregaInvalidaError('Previsão deve ser no futuro');
    }
  }
  /**
   * Aceita a entrega por um entregador
   */
  aceitar(entregadorId: string): void {
    if (this.status !== StatusEntrega.AGUARDANDO_ACEITE) {
      throw new TransicaoStatusEntregaInvalidaError(this.status, StatusEntrega.ACEITA);
    }

    if (!entregadorId?.trim()) {
      throw new EntregaSemEntregadorError();
    }

    if (!this.enderecoEntrega) {
      throw new EntregaInvalidaError('Endereço de entrega é obrigatório para aceitar a entrega');
    }

    const statusAnterior = this.status;
    this.entregadorId = entregadorId;
    this.status = StatusEntrega.ACEITA;

    this.adicionarEvento(new EntregaAceitaEvent(
      this.id,
      entregadorId,
      this.pedidoId,
      this.enderecoEntrega
    ));    this.adicionarEvento(new StatusEntregaAlteradoEvent(
      this.id,
      statusAnterior,
      this.status,
      entregadorId
    ));
  }
  /**
   * Confirma retirada do pedido
   */
  confirmarRetirada(): void {
    if (this.status !== StatusEntrega.ACEITA && this.status !== StatusEntrega.PENDENTE) {
      throw new TransicaoStatusEntregaInvalidaError(this.status, StatusEntrega.EM_ROTA);
    }

    if (!this.entregadorId) {
      throw new EntregaSemEntregadorError();
    }

    const statusAnterior = this.status;
    this.status = StatusEntrega.EM_ROTA;
    this.dataRetirada = new Date();

    this.adicionarEvento(new EntregaIniciadaEvent(
      this.id,
      this.entregadorId,
      this.pedidoId,
      this.dataRetirada
    ));

    this.adicionarEvento(new StatusEntregaAlteradoEvent(
      this.id,
      statusAnterior,
      this.status,
      this.entregadorId
    ));
  }
  /**
   * Confirma entrega realizada
   */
  confirmarEntrega(): void {
    if (this.status !== StatusEntrega.EM_ROTA) {
      throw new TransicaoStatusEntregaInvalidaError(this.status, StatusEntrega.ENTREGUE);
    }

    if (!this.entregadorId) {
      throw new EntregaSemEntregadorError();
    }

    const statusAnterior = this.status;
    this.status = StatusEntrega.ENTREGUE;
    this.dataEntrega = new Date();

    // Calcula tempo total em minutos
    const tempoTotal = this.dataRetirada 
      ? Math.round((this.dataEntrega.getTime() - this.dataRetirada.getTime()) / (1000 * 60))
      : 0;

    this.adicionarEvento(new EntregaFinalizadaEvent(
      this.id,
      this.entregadorId,
      this.pedidoId,
      this.dataEntrega,
      tempoTotal
    ));

    this.adicionarEvento(new StatusEntregaAlteradoEvent(
      this.id,
      statusAnterior,
      this.status,
      this.entregadorId
    ));
  }

  /**
   * Cancela a entrega
   */
  cancelar(motivo?: string): void {
    if (this.status === StatusEntrega.ENTREGUE) {
      throw new EntregaNaoPodeSerCanceladaError(this.status);
    }

    if (this.status === StatusEntrega.CANCELADA) {
      throw new EntregaJaFinalizadaError(this.status);
    }

    const statusAnterior = this.status;
    this.status = StatusEntrega.CANCELADA;

    this.adicionarEvento(new EntregaCanceladaEvent(
      this.id,
      this.pedidoId,
      this.entregadorId,
      motivo || 'Cancelamento solicitado',
      statusAnterior
    ));

    this.adicionarEvento(new StatusEntregaAlteradoEvent(
      this.id,
      statusAnterior,
      this.status,
      this.entregadorId
    ));
  }

  /**
   * Atualiza previsão de entrega
   */
  atualizarPrevisao(novaPrevisao: Date): void {
    if (this.status === StatusEntrega.ENTREGUE || this.status === StatusEntrega.CANCELADA) {
      throw new EntregaJaFinalizadaError(this.status);
    }

    if (novaPrevisao <= new Date()) {
      throw new PrevisaoEntregaInvalidaError('Nova previsão deve ser no futuro');
    }

    this.previsaoEntrega = novaPrevisao;
  }

  /**
   * Atualiza observações
   */
  atualizarObservacoes(observacoes: string): void {
    if (this.status === StatusEntrega.ENTREGUE || this.status === StatusEntrega.CANCELADA) {
      throw new EntregaJaFinalizadaError(this.status);
    }

    this.observacoes = observacoes?.trim() || null;
  }

  /**
   * Verifica se a entrega está disponível para aceite
   */
  podeSerAceita(): boolean {
    return this.status === StatusEntrega.AGUARDANDO_ACEITE;
  }

  /**
   * Verifica se a entrega pode ser iniciada (retirada)
   */
  podeIniciar(): boolean {
    return (this.status === StatusEntrega.ACEITA || this.status === StatusEntrega.PENDENTE) && 
           this.entregadorId !== null;
  }

  /**
   * Verifica se a entrega pode ser finalizada
   */
  podeFinalizar(): boolean {
    return this.status === StatusEntrega.EM_ROTA && this.entregadorId !== null;
  }

  /**
   * Verifica se a entrega pode ser cancelada
   */
  podeSerCancelada(): boolean {
    return this.status !== StatusEntrega.ENTREGUE && this.status !== StatusEntrega.CANCELADA;
  }

  /**
   * Calcula tempo estimado de entrega em minutos
   */
  calcularTempoEstimado(): number {
    if (!this.enderecoColeta || !this.enderecoEntrega) return 60; // 1 hora padrão

    const distancia = this.enderecoColeta.calcularDistancia(this.enderecoEntrega);
    
    // Velocidade média urbana: 30 km/h
    const tempoViagem = (distancia / 30) * 60; // em minutos
    const tempoPreparacao = 15; // 15 minutos para preparação/coleta
    
    return Math.ceil(tempoViagem + tempoPreparacao);
  }

  /**
   * Verifica se está atrasada
   */
  estaAtrasada(): boolean {
    if (!this.previsaoEntrega) return false;
    
    const agora = new Date();
    return agora > this.previsaoEntrega && 
           this.status !== StatusEntrega.ENTREGUE && 
           this.status !== StatusEntrega.CANCELADA;
  }

  /**
   * Calcula tempo de atraso em minutos
   */
  calcularAtraso(): number {
    if (!this.estaAtrasada()) return 0;
    
    const agora = new Date();
    const diferenca = agora.getTime() - this.previsaoEntrega.getTime();
    return Math.floor(diferenca / (1000 * 60)); // em minutos
  }

  /**
   * Verifica se a entrega está finalizada
   */
  estaFinalizada(): boolean {
    return this.status === StatusEntrega.ENTREGUE || this.status === StatusEntrega.CANCELADA;
  }

  /**
   * Obtém status amigável
   */
  getStatusDescricao(): string {
    const descricoes = {
      [StatusEntrega.AGUARDANDO_ACEITE]: 'Aguardando aceite do entregador',
      [StatusEntrega.PENDENTE]: 'Pendente',
      [StatusEntrega.ACEITA]: 'Aceita pelo entregador',
      [StatusEntrega.EM_ROTA]: 'Em rota de entrega',
      [StatusEntrega.ENTREGUE]: 'Entregue',
      [StatusEntrega.CANCELADA]: 'Cancelada'
    };
    return descricoes[this.status] || 'Status desconhecido';
  }

  // ===== DOMAIN EVENTS =====

  private adicionarEvento(evento: DomainEvent): void {
    this._domainEvents.push(evento);
  }

  getDomainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  // ===== FACTORY METHODS =====

  /**
   * Cria nova entrega
   */
  static criar(
    pedidoId: string,
    enderecoColeta: EnderecoVO,
    enderecoEntrega: EnderecoVO,
    valorFrete?: number
  ): Entrega {
    const entrega = new Entrega();
    entrega.pedidoId = pedidoId;
    entrega.enderecoColeta = enderecoColeta;
    entrega.enderecoEntrega = enderecoEntrega;
    entrega.valorFrete = valorFrete || 0;
    entrega.status = StatusEntrega.AGUARDANDO_ACEITE;
    
    // Calcular previsão baseada na distância
    const tempoEstimado = entrega.calcularTempoEstimado();
    entrega.previsaoEntrega = new Date(Date.now() + tempoEstimado * 60 * 1000);

    entrega.validar();

    entrega.adicionarEvento(new EntregaCriadaEvent(
      entrega.id,
      pedidoId,
      enderecoColeta,
      enderecoEntrega,
      entrega.valorFrete,
      entrega.previsaoEntrega
    ));

    return entrega;
  }

  /**
   * Reconstitui entrega do banco de dados
   */
  static reconstituir(dados: Partial<Entrega>): Entrega {
    const entrega = new Entrega();
    Object.assign(entrega, dados);
    return entrega;
  }
}
