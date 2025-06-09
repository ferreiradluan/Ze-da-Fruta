import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/core/base.entity';
import { AggregateRoot } from '../../../common/domain/aggregate-root.base';
import { Dinheiro } from '../value-objects/dinheiro.vo';
import {
  CupomInativoError,
  CupomExpiradoError,
  CupomUsosExcedidosError,
  CupomCodigoInvalidoError,
  CupomValorMinimoNaoAtingidoError,
  CupomInvalidoError,
  CupomEsgotadoError,  ValorMinimoInvalidoError
} from '../errors';
import {
  CupomCriadoEvent,
  CupomUtilizadoEvent,
  CupomDesativadoEvent,
  CupomExpiradoEvent,
  CupomValidadoEvent,
  CupomUsadoEvent
} from '../events';

export enum TipoDesconto {
  PERCENTUAL = 'PERCENTUAL',
  FIXO = 'FIXO'
}

export enum StatusCupom {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
  EXPIRADO = 'EXPIRADO',
  ESGOTADO = 'ESGOTADO'
}

export enum TipoCupom {
  PROMOCIONAL = 'PROMOCIONAL',
  PRIMEIRA_COMPRA = 'PRIMEIRA_COMPRA',
  FIDELIDADE = 'FIDELIDADE',
  DESCONTO_ESTABELECIMENTO = 'DESCONTO_ESTABELECIMENTO',
  CASHBACK = 'CASHBACK',
  FRETE_GRATIS = 'FRETE_GRATIS'
}

export interface RestricoesUso {
  diasSemana?: number[]; // 0-6 (domingo-sábado)
  horaInicio?: string; // HH:mm
  horaFim?: string; // HH:mm
  estabelecimentosPermitidos?: string[];
  categoriasPermitidas?: string[];
  produtosPermitidos?: string[];
  clientesPermitidos?: string[];
  primeiraCompraApenas?: boolean;
  usoUnicoporCliente?: boolean;
}

@Entity()
export class Cupom extends BaseEntity {
  private _aggregateRoot: AggregateRoot = new (class extends AggregateRoot {})(this.id || '');

  @Column({ unique: true })
  codigo: string;

  @Column({
    type: 'varchar',
    enum: TipoDesconto,
    default: TipoDesconto.PERCENTUAL
  })
  tipoDesconto: TipoDesconto;

  @Column('decimal', { precision: 10, scale: 2 })
  valor: number;

  @Column()
  dataValidade: Date;

  @Column({ default: true })
  ativo: boolean;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  valorMinimoCompra: number | null;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  valorMaximoDesconto: number | null;

  @Column({ default: 1 })
  limitesUso: number;

  @Column({ default: 0 })
  vezesUsado: number;

  // Novos campos para domínio rico
  @Column({
    type: 'varchar',
    enum: StatusCupom,
    default: StatusCupom.ATIVO
  })
  status: StatusCupom;

  @Column({
    type: 'varchar',
    enum: TipoCupom,
    default: TipoCupom.PROMOCIONAL
  })
  tipo: TipoCupom;

  @Column({ nullable: true })
  nome: string | null;

  @Column({ nullable: true })
  descricao: string | null;

  @Column({ nullable: true })
  dataInicio: Date | null;

  @Column({ nullable: true })
  estabelecimentoId: string | null;

  @Column({ nullable: true })
  criadoPor: string | null;

  @Column('json', { nullable: true })
  restricoes: RestricoesUso | null;

  @Column('json', { nullable: true })
  historiocoUso: any[] | null;

  @Column({ default: false })
  cumulativo: boolean; // Pode ser usado com outros cupons

  @Column({ default: 0 })
  prioridade: number; // Ordem de aplicação quando múltiplos cupons

  @Column({ nullable: true })
  imagemUrl: string | null;

  @Column({ nullable: true })
  corHex: string | null;

  @Column({ default: false })
  publicado: boolean;

  @Column({ nullable: true })
  motivoDesativacao: string | null;

  // ===== MÉTODOS DE NEGÓCIO (RICH DOMAIN) =====

  static criar(dados: {
    codigo: string;
    tipoDesconto: TipoDesconto;
    valor: number;
    dataValidade: Date;
    limitesUso: number;
    valorMinimoCompra?: number;
    valorMaximoDesconto?: number;
    tipo?: TipoCupom;
    nome?: string;
    descricao?: string;
    estabelecimentoId?: string;
    restricoes?: RestricoesUso;
  }): Cupom {
    const cupom = new Cupom();
    cupom.validarDadosObrigatorios(dados);
    
    cupom.codigo = dados.codigo.toUpperCase().trim();
    cupom.tipoDesconto = dados.tipoDesconto;
    cupom.valor = dados.valor;
    cupom.dataValidade = dados.dataValidade;
    cupom.limitesUso = dados.limitesUso;
    cupom.valorMinimoCompra = dados.valorMinimoCompra || null;
    cupom.valorMaximoDesconto = dados.valorMaximoDesconto || null;
    cupom.tipo = dados.tipo || TipoCupom.PROMOCIONAL;
    cupom.nome = dados.nome?.trim() || null;
    cupom.descricao = dados.descricao?.trim() || null;
    cupom.estabelecimentoId = dados.estabelecimentoId || null;
    cupom.restricoes = dados.restricoes || null;
    
    // Valores padrão
    cupom.ativo = true;
    cupom.status = StatusCupom.ATIVO;
    cupom.vezesUsado = 0;
    cupom.cumulativo = false;
    cupom.prioridade = 0;
    cupom.publicado = false;
    cupom.historiocoUso = [];
    cupom.dataInicio = new Date();

    return cupom;
  }

  private validarDadosObrigatorios(dados: any): void {
    if (!dados.codigo?.trim()) {
      throw new CupomInvalidoError('Código do cupom é obrigatório');
    }

    if (dados.codigo.length < 3) {
      throw new CupomCodigoInvalidoError('Código deve ter pelo menos 3 caracteres');
    }

    if (dados.codigo.length > 20) {
      throw new CupomCodigoInvalidoError('Código não pode ter mais de 20 caracteres');
    }

    if (!/^[A-Z0-9]+$/.test(dados.codigo.toUpperCase())) {
      throw new CupomCodigoInvalidoError('Código deve conter apenas letras e números');
    }

    if (dados.valor <= 0) {
      throw new CupomInvalidoError('Valor do desconto deve ser maior que zero');
    }

    if (dados.tipoDesconto === TipoDesconto.PERCENTUAL && dados.valor > 100) {
      throw new CupomInvalidoError('Desconto percentual não pode ser maior que 100%');
    }

    if (!dados.dataValidade) {
      throw new CupomInvalidoError('Data de validade é obrigatória');
    }

    if (dados.dataValidade <= new Date()) {
      throw new CupomInvalidoError('Data de validade deve ser futura');
    }

    if (dados.limitesUso <= 0) {
      throw new CupomInvalidoError('Limite de uso deve ser maior que zero');
    }

    if (dados.valorMinimoCompra && dados.valorMinimoCompra < 0) {
      throw new ValorMinimoInvalidoError('Valor mínimo de compra não pode ser negativo');
    }

    if (dados.valorMaximoDesconto && dados.valorMaximoDesconto <= 0) {
      throw new CupomInvalidoError('Valor máximo de desconto deve ser maior que zero');
    }
  }

  // Validações de uso
  estaValido(): boolean {
    const agora = new Date();
    return (
      this.ativo &&
      this.status === StatusCupom.ATIVO &&
      this.dataValidade >= agora &&
      this.vezesUsado < this.limitesUso &&
      (!this.dataInicio || this.dataInicio <= agora)
    );
  }

  podeSerAplicado(valorCompra: number, contexto?: {
    clienteId?: string;
    estabelecimentoId?: string;
    diaSemana?: number;
    hora?: string;
    produtos?: string[];
    categorias?: string[];
    ehPrimeiraCompra?: boolean;
  }): boolean {
    if (!this.estaValido()) {
      return false;
    }

    // Verificar valor mínimo
    if (this.valorMinimoCompra && valorCompra < this.valorMinimoCompra) {
      return false;
    }

    // Verificar restrições se fornecidas
    if (this.restricoes && contexto) {
      return this.verificarRestricoes(contexto);
    }

    return true;
  }

  private verificarRestricoes(contexto: any): boolean {
    if (!this.restricoes) return true;

    // Verificar dias da semana
    if (this.restricoes.diasSemana && contexto.diaSemana !== undefined) {
      if (!this.restricoes.diasSemana.includes(contexto.diaSemana)) {
        return false;
      }
    }

    // Verificar horário
    if (this.restricoes.horaInicio && this.restricoes.horaFim && contexto.hora) {
      if (contexto.hora < this.restricoes.horaInicio || contexto.hora > this.restricoes.horaFim) {
        return false;
      }
    }

    // Verificar estabelecimentos
    if (this.restricoes.estabelecimentosPermitidos && contexto.estabelecimentoId) {
      if (!this.restricoes.estabelecimentosPermitidos.includes(contexto.estabelecimentoId)) {
        return false;
      }
    }

    // Verificar primeira compra
    if (this.restricoes.primeiraCompraApenas && !contexto.ehPrimeiraCompra) {
      return false;
    }

    // Verificar uso único por cliente
    if (this.restricoes.usoUnicoporCliente && contexto.clienteId) {
      const jaUsou = this.historiocoUso?.some(uso => uso.clienteId === contexto.clienteId);
      if (jaUsou) {
        return false;
      }
    }

    return true;
  }

  // Cálculo de desconto
  calcularDesconto(valorCompra: number): number {
    if (!this.podeSerAplicado(valorCompra)) {
      return 0;
    }

    let desconto = 0;
    
    if (this.tipoDesconto === TipoDesconto.PERCENTUAL) {
      desconto = valorCompra * (this.valor / 100);
    } else {
      desconto = this.valor;
    }

    // Aplicar limite máximo de desconto se definido
    if (this.valorMaximoDesconto && desconto > this.valorMaximoDesconto) {
      desconto = this.valorMaximoDesconto;
    }

    // Desconto não pode ser maior que o valor da compra
    return Math.min(desconto, valorCompra);
  }

  // Uso do cupom
  usar(contexto?: {
    clienteId?: string;
    pedidoId?: string;
    valorCompra?: number;
    valorDesconto?: number;
    estabelecimentoId?: string;
  }): void {
    if (!this.estaValido()) {
      throw new CupomInvalidoError('Cupom inválido ou expirado');
    }

    this.vezesUsado++;
    
    // Registrar no histórico
    if (!this.historiocoUso) {
      this.historiocoUso = [];
    }
    
    this.historiocoUso.push({
      dataUso: new Date(),
      clienteId: contexto?.clienteId,
      pedidoId: contexto?.pedidoId,
      valorCompra: contexto?.valorCompra,
      valorDesconto: contexto?.valorDesconto,
      estabelecimentoId: contexto?.estabelecimentoId
    });

    // Verificar se esgotou
    if (this.vezesUsado >= this.limitesUso) {
      this.status = StatusCupom.ESGOTADO;
    }    // Disparar evento de uso
    this.addDomainEvent(new CupomUsadoEvent(
      this.id || '',
      this.codigo,
      contexto?.pedidoId || '',
      contexto?.clienteId || '',
      contexto?.valorDesconto || 0,
      new Date()
    ));
  }

  // Gestão de status
  ativar(): void {    if (this.status === StatusCupom.EXPIRADO) {
      throw new CupomExpiradoError(this.codigo, this.dataValidade);
    }
      if (this.status === StatusCupom.ESGOTADO) {
      throw new CupomEsgotadoError(this.codigo);
    }
    
    this.ativo = true;
    this.status = StatusCupom.ATIVO;
    this.motivoDesativacao = null;
  }

  desativar(motivo?: string): void {
    this.ativo = false;
    this.status = StatusCupom.INATIVO;
    this.motivoDesativacao = motivo || 'Desativado manualmente';
  }

  marcarComoExpirado(): void {
    this.status = StatusCupom.EXPIRADO;
    this.ativo = false;
  }

  publicar(): void {
    if (!this.estaValido()) {
      throw new CupomInvalidoError('Apenas cupons válidos podem ser publicados');
    }
    this.publicado = true;
  }

  despublicar(): void {
    this.publicado = false;
  }

  // Atualização de dados
  atualizarDados(dados: {
    nome?: string;
    descricao?: string;
    dataValidade?: Date;
    limitesUso?: number;
    valorMinimoCompra?: number;
    valorMaximoDesconto?: number;
  }): void {
    if (this.vezesUsado > 0) {
      throw new CupomInvalidoError('Cupom já foi usado e não pode ser editado');
    }

    if (dados.nome !== undefined) {
      this.nome = dados.nome?.trim() || null;
    }

    if (dados.descricao !== undefined) {
      this.descricao = dados.descricao?.trim() || null;
    }

    if (dados.dataValidade) {
      if (dados.dataValidade <= new Date()) {
        throw new CupomInvalidoError('Data de validade deve ser futura');
      }
      this.dataValidade = dados.dataValidade;
    }

    if (dados.limitesUso !== undefined) {
      if (dados.limitesUso <= 0) {
        throw new CupomInvalidoError('Limite de uso deve ser maior que zero');
      }
      this.limitesUso = dados.limitesUso;
    }

    if (dados.valorMinimoCompra !== undefined) {
      this.valorMinimoCompra = dados.valorMinimoCompra || null;
    }

    if (dados.valorMaximoDesconto !== undefined) {
      this.valorMaximoDesconto = dados.valorMaximoDesconto || null;
    }
  }

  // Consultas de negócio
  estaExpirado(): boolean {
    return new Date() > this.dataValidade;
  }

  estaEsgotado(): boolean {
    return this.vezesUsado >= this.limitesUso;
  }

  getUsosRestantes(): number {
    return Math.max(0, this.limitesUso - this.vezesUsado);
  }

  getPercentualUso(): number {
    return (this.vezesUsado / this.limitesUso) * 100;
  }

  getDiasParaExpirar(): number {
    const agora = new Date();
    const diffTime = this.dataValidade.getTime() - agora.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getValorDesconto(): Dinheiro {
    return Dinheiro.criar(this.valor);
  }

  temRestricoes(): boolean {
    return this.restricoes !== null && Object.keys(this.restricoes).length > 0;
  }

  ehFreteGratis(): boolean {
    return this.tipo === TipoCupom.FRETE_GRATIS;
  }

  ehPrimeiraCompra(): boolean {
    return this.tipo === TipoCupom.PRIMEIRA_COMPRA;
  }

  // Validações
  podeSerEditado(): boolean {
    return this.vezesUsado === 0 && this.status !== StatusCupom.EXPIRADO;
  }

  podeSerExcluido(): boolean {
    return this.vezesUsado === 0;
  }

  ehValido(): boolean {
    return this.codigo?.trim().length >= 3 && this.valor > 0 && this.limitesUso > 0;
  }

  // Factory Methods
  static criarCupomPercentual(
    codigo: string,
    percentual: number,
    dataValidade: Date,
    limitesUso: number
  ): Cupom {
    return this.criar({
      codigo,
      tipoDesconto: TipoDesconto.PERCENTUAL,
      valor: percentual,
      dataValidade,
      limitesUso
    });
  }

  static criarCupomValorFixo(
    codigo: string,
    valor: number,
    dataValidade: Date,
    limitesUso: number
  ): Cupom {
    return this.criar({
      codigo,
      tipoDesconto: TipoDesconto.FIXO,
      valor,
      dataValidade,
      limitesUso
    });
  }

  static criarCupomPrimeiraCompra(
    codigo: string,
    valor: number,
    dataValidade: Date
  ): Cupom {
    return this.criar({
      codigo,
      tipoDesconto: TipoDesconto.PERCENTUAL,
      valor,
      dataValidade,
      limitesUso: 999999, // Ilimitado para primeira compra
      tipo: TipoCupom.PRIMEIRA_COMPRA,
      restricoes: {
        primeiraCompraApenas: true,
        usoUnicoporCliente: true
      }
    });
  }

  // Método de resumo
  obterResumo(): any {
    return {
      id: this.id,
      codigo: this.codigo,
      nome: this.nome,
      descricao: this.descricao,
      tipo: this.tipo,
      tipoDesconto: this.tipoDesconto,
      valor: this.valor,
      status: this.status,
      ativo: this.ativo,
      publicado: this.publicado,
      dataInicio: this.dataInicio,
      dataValidade: this.dataValidade,
      valorMinimoCompra: this.valorMinimoCompra,
      valorMaximoDesconto: this.valorMaximoDesconto,
      limitesUso: this.limitesUso,
      vezesUsado: this.vezesUsado,
      usosRestantes: this.getUsosRestantes(),
      percentualUso: this.getPercentualUso(),
      diasParaExpirar: this.getDiasParaExpirar(),
      estabelecimentoId: this.estabelecimentoId,
      restricoes: this.restricoes,
      cumulativo: this.cumulativo,
      prioridade: this.prioridade,
      imagemUrl: this.imagemUrl,
      corHex: this.corHex,
      // Flags de negócio
      estaValido: this.estaValido(),
      estaExpirado: this.estaExpirado(),
      estaEsgotado: this.estaEsgotado(),
      temRestricoes: this.temRestricoes(),
      ehFreteGratis: this.ehFreteGratis(),
      ehPrimeiraCompra: this.ehPrimeiraCompra(),
      podeSerEditado: this.podeSerEditado(),
      podeSerExcluido: this.podeSerExcluido(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // ===== DOMAIN EVENTS MANAGEMENT =====
  
  /**
   * Gets all uncommitted domain events
   */
  getUncommittedEvents(): any[] {
    return this._aggregateRoot.getUncommittedEvents();
  }

  /**
   * Marks all domain events as committed
   */
  markEventsAsCommitted(): void {
    this._aggregateRoot.markEventsAsCommitted();
  }

  /**
   * Adds a domain event to the aggregate
   */
  private addDomainEvent(domainEvent: any): void {
    (this._aggregateRoot as any).addDomainEvent(domainEvent);
  }

  /**
   * Clears all domain events
   */
  private clearDomainEvents(): void {
    (this._aggregateRoot as any).clearDomainEvents();
  }
}
