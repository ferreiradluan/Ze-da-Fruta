import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/core/base.entity';
import { AggregateRoot } from '../../../common/domain/aggregate-root.base';
import { Produto } from './produto.entity';
import { 
  EstabelecimentoInvalidoError,
  EstabelecimentoInativoError,
  CNPJInvalidoError,
  EnderecoInvalidoError,
  EmailInvalidoError,  TelefoneInvalidoError
} from '../errors';
import { 
  EstabelecimentoCriadoEvent,
  EstabelecimentoAtualizadoEvent,
  EstabelecimentoAbertoEvent,
  EstabelecimentoFechadoEvent,
  EstabelecimentoDesativadoEvent,
  EstabelecimentoLocalizacaoAtualizadaEvent
} from '../events';

export enum TipoEstabelecimento {
  RESTAURANTE = 'RESTAURANTE',
  LANCHONETE = 'LANCHONETE',
  PIZZARIA = 'PIZZARIA',
  PADARIA = 'PADARIA',
  MERCADO = 'MERCADO',
  FARMACIA = 'FARMACIA',
  OUTROS = 'OUTROS'
}

export enum StatusEstabelecimento {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
  PENDENTE_APROVACAO = 'PENDENTE_APROVACAO',
  SUSPENSO = 'SUSPENSO',
  BLOQUEADO = 'BLOQUEADO'
}

export interface HorarioFuncionamento {
  diaSemana: number; // 0-6 (domingo-sábado)
  abertura: string; // HH:mm
  fechamento: string; // HH:mm
  fechado: boolean;
}

export interface Localizacao {
  latitude: number;
  longitude: number;
  endereco: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  cep: string;
  estado: string;
}

@Entity()
export class Estabelecimento extends BaseEntity {
  private _aggregateRoot: AggregateRoot = new (class extends AggregateRoot {})(this.id || '');

  @Column()
  nome: string;

  @Column()
  cnpj: string;

  @Column()
  endereco: string;

  @Column({ nullable: true })
  telefone: string | null;

  @Column({ nullable: true })
  email: string | null;

  @Column({ default: true })
  ativo: boolean;

  @Column({ default: true })
  estaAberto: boolean;

  @Column({ nullable: true })
  descricao: string | null;

  @Column({ nullable: true })
  imagemUrl: string | null; // URL/caminho da imagem do estabelecimento

  @Column('decimal', { precision: 10, scale: 8, nullable: true })
  latitude: number | null;

  @Column('decimal', { precision: 11, scale: 8, nullable: true })
  longitude: number | null;

  // Novos campos para domínio rico
  @Column({
    type: 'varchar',
    enum: TipoEstabelecimento,
    default: TipoEstabelecimento.OUTROS
  })
  tipo: TipoEstabelecimento;

  @Column({
    type: 'varchar',
    enum: StatusEstabelecimento,
    default: StatusEstabelecimento.PENDENTE_APROVACAO
  })
  status: StatusEstabelecimento;

  @Column({ nullable: true })
  nomeFantasia: string | null;

  @Column({ nullable: true })
  razaoSocial: string | null;

  @Column({ nullable: true })
  inscricaoEstadual: string | null;

  @Column({ nullable: true })
  inscricaoMunicipal: string | null;

  @Column('json', { nullable: true })
  horarioFuncionamento: HorarioFuncionamento[] | null;

  @Column('decimal', { precision: 3, scale: 1, default: 0 })
  avaliacaoMedia: number;

  @Column({ default: 0 })
  totalAvaliacoes: number;

  @Column({ default: 0 })
  totalPedidos: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  faturamentoTotal: number;

  @Column({ default: 0 })
  tempoPreparodMedio: number; // em minutos

  @Column({ nullable: true })
  responsavelId: string | null;

  @Column({ nullable: true })
  whatsapp: string | null;

  @Column({ nullable: true })
  instagram: string | null;

  @Column({ nullable: true })
  facebook: string | null;

  @Column({ nullable: true })
  website: string | null;

  @Column({ default: false })
  aceitaRetirada: boolean;

  @Column({ default: false })
  aceitaDelivery: boolean;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  taxaEntrega: number | null;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  pedidoMinimo: number | null;

  @Column({ default: 0 })
  raioEntrega: number; // em KM

  @Column({ nullable: true })
  motivoInativacao: string | null;

  @Column({ nullable: true })
  dataAprovacao: Date | null;

  @Column({ nullable: true })
  dataInativacao: Date | null;

  @OneToMany(() => Produto, produto => produto.estabelecimento)
  produtos: Produto[];

  // ===== MÉTODOS DE NEGÓCIO (RICH DOMAIN) =====

  static criar(dados: {
    nome: string;
    cnpj: string;
    endereco: string;
    telefone?: string;
    email?: string;
    tipo: TipoEstabelecimento;
    responsavelId?: string;
  }): Estabelecimento {
    const estabelecimento = new Estabelecimento();
    estabelecimento.validarDadosObrigatorios(dados);
    
    estabelecimento.nome = dados.nome.trim();
    estabelecimento.cnpj = dados.cnpj.replace(/\D/g, ''); // Remove não-dígitos
    estabelecimento.endereco = dados.endereco.trim();
    estabelecimento.telefone = dados.telefone?.replace(/\D/g, '') || null;
    estabelecimento.email = dados.email?.toLowerCase().trim() || null;
    estabelecimento.tipo = dados.tipo;
    estabelecimento.responsavelId = dados.responsavelId || null;
    
    // Valores padrão
    estabelecimento.ativo = true;
    estabelecimento.estaAberto = false; // Começa fechado até definir horários
    estabelecimento.status = StatusEstabelecimento.PENDENTE_APROVACAO;
    estabelecimento.avaliacaoMedia = 0;
    estabelecimento.totalAvaliacoes = 0;
    estabelecimento.totalPedidos = 0;
    estabelecimento.faturamentoTotal = 0;
    estabelecimento.tempoPreparodMedio = 30; // 30 minutos padrão
    estabelecimento.aceitaRetirada = true;
    estabelecimento.aceitaDelivery = false;
    estabelecimento.raioEntrega = 0;
    estabelecimento.produtos = [];

    return estabelecimento;
  }

  private validarDadosObrigatorios(dados: any): void {
    if (!dados.nome?.trim()) {
      throw new EstabelecimentoInvalidoError('Nome do estabelecimento é obrigatório');
    }

    if (dados.nome.length < 2) {
      throw new EstabelecimentoInvalidoError('Nome deve ter pelo menos 2 caracteres');
    }

    if (!dados.cnpj) {
      throw new EstabelecimentoInvalidoError('CNPJ é obrigatório');
    }

    if (!this.validarCNPJ(dados.cnpj)) {
      throw new CNPJInvalidoError(dados.cnpj);
    }

    if (!dados.endereco?.trim()) {
      throw new EstabelecimentoInvalidoError('Endereço é obrigatório');
    }

    if (dados.email && !this.validarEmail(dados.email)) {
      throw new EmailInvalidoError(dados.email);
    }

    if (dados.telefone && !this.validarTelefone(dados.telefone)) {
      throw new TelefoneInvalidoError(dados.telefone);
    }
  }

  private validarCNPJ(cnpj: string): boolean {
    cnpj = cnpj.replace(/\D/g, '');
    
    if (cnpj.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cnpj)) return false; // Todos os dígitos iguais
    
    // Validação dos dígitos verificadores
    let soma = 0;
    const pesos = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    
    for (let i = 0; i < 12; i++) {
      soma += parseInt(cnpj[i]) * pesos[i];
    }
    
    let resto = soma % 11;
    const dv1 = resto < 2 ? 0 : 11 - resto;
    
    if (dv1 !== parseInt(cnpj[12])) return false;
    
    soma = 0;
    const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    
    for (let i = 0; i < 13; i++) {
      soma += parseInt(cnpj[i]) * pesos2[i];
    }
    
    resto = soma % 11;
    const dv2 = resto < 2 ? 0 : 11 - resto;
    
    return dv2 === parseInt(cnpj[13]);
  }

  private validarEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  private validarTelefone(telefone: string): boolean {
    const somenteNumeros = telefone.replace(/\D/g, '');
    return somenteNumeros.length >= 10 && somenteNumeros.length <= 11;
  }

  // Gestão de Status
  aprovar(): void {
    if (this.status !== StatusEstabelecimento.PENDENTE_APROVACAO) {
      throw new EstabelecimentoInvalidoError('Apenas estabelecimentos pendentes podem ser aprovados');
    }
    
    this.status = StatusEstabelecimento.ATIVO;
    this.dataAprovacao = new Date();
  }

  suspender(motivo: string): void {
    if (this.status === StatusEstabelecimento.INATIVO) {
      throw new EstabelecimentoInvalidoError('Estabelecimento já está inativo');
    }
    
    this.status = StatusEstabelecimento.SUSPENSO;
    this.motivoInativacao = motivo;
    this.estaAberto = false;
  }

  bloquear(motivo: string): void {
    this.status = StatusEstabelecimento.BLOQUEADO;
    this.motivoInativacao = motivo;
    this.estaAberto = false;
  }

  reativar(): void {
    if (this.status === StatusEstabelecimento.ATIVO) {
      throw new EstabelecimentoInvalidoError('Estabelecimento já está ativo');
    }
    
    this.status = StatusEstabelecimento.ATIVO;
    this.motivoInativacao = null;
    this.dataInativacao = null;
  }

  desativar(motivo?: string): void {
    this.ativo = false;
    this.estaAberto = false;
    this.status = StatusEstabelecimento.INATIVO;
    this.motivoInativacao = motivo || 'Não informado';
    this.dataInativacao = new Date();
  }

  // Gestão de Funcionamento
  abrir(): void {
    if (!this.ativo) {
      throw new EstabelecimentoInativoError('Estabelecimento inativo não pode ser aberto');
    }
    
    if (this.status !== StatusEstabelecimento.ATIVO) {
      throw new EstabelecimentoInvalidoError('Apenas estabelecimentos ativos podem ser abertos');
    }
    
    if (!this.podeAbrirAgora()) {
      throw new EstabelecimentoInvalidoError('Estabelecimento fora do horário de funcionamento');
    }
    
    this.estaAberto = true;
  }

  fechar(): void {
    this.estaAberto = false;
  }

  definirHorarioFuncionamento(horarios: HorarioFuncionamento[]): void {
    // Validar horários
    for (const horario of horarios) {
      if (horario.diaSemana < 0 || horario.diaSemana > 6) {
        throw new EstabelecimentoInvalidoError('Dia da semana deve estar entre 0 e 6');
      }
      
      if (!horario.fechado) {
        if (!this.validarHorario(horario.abertura) || !this.validarHorario(horario.fechamento)) {
          throw new EstabelecimentoInvalidoError('Horários devem estar no formato HH:mm');
        }
      }
    }
    
    this.horarioFuncionamento = horarios;
  }

  private validarHorario(horario: string): boolean {
    const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(horario);
  }

  private podeAbrirAgora(): boolean {
    if (!this.horarioFuncionamento || this.horarioFuncionamento.length === 0) {
      return false; // Sem horário definido, não pode abrir
    }
    
    const agora = new Date();
    const diaSemana = agora.getDay();
    const horaAtual = `${agora.getHours().toString().padStart(2, '0')}:${agora.getMinutes().toString().padStart(2, '0')}`;
    
    const horarioHoje = this.horarioFuncionamento.find(h => h.diaSemana === diaSemana);
    
    if (!horarioHoje || horarioHoje.fechado) {
      return false;
    }
    
    return horaAtual >= horarioHoje.abertura && horaAtual <= horarioHoje.fechamento;
  }

  // Gestão de Localização
  definirLocalizacao(localizacao: Localizacao): void {
    this.validarLocalizacao(localizacao);
    
    this.latitude = localizacao.latitude;
    this.longitude = localizacao.longitude;
    this.endereco = localizacao.endereco;
  }

  private validarLocalizacao(localizacao: Localizacao): void {
    if (localizacao.latitude < -90 || localizacao.latitude > 90) {
      throw new EnderecoInvalidoError('Latitude deve estar entre -90 e 90');
    }
    
    if (localizacao.longitude < -180 || localizacao.longitude > 180) {
      throw new EnderecoInvalidoError('Longitude deve estar entre -180 e 180');
    }
    
    if (!localizacao.endereco?.trim()) {
      throw new EnderecoInvalidoError('Endereço é obrigatório');
    }
  }

  // Gestão de Delivery
  habilitarDelivery(taxaEntrega: number, raioEntrega: number, pedidoMinimo?: number): void {
    if (taxaEntrega < 0) {
      throw new EstabelecimentoInvalidoError('Taxa de entrega não pode ser negativa');
    }
    
    if (raioEntrega <= 0) {
      throw new EstabelecimentoInvalidoError('Raio de entrega deve ser maior que zero');
    }
    
    if (pedidoMinimo && pedidoMinimo < 0) {
      throw new EstabelecimentoInvalidoError('Pedido mínimo não pode ser negativo');
    }
    
    this.aceitaDelivery = true;
    this.taxaEntrega = taxaEntrega;
    this.raioEntrega = raioEntrega;
    this.pedidoMinimo = pedidoMinimo || null;
  }

  desabilitarDelivery(): void {
    this.aceitaDelivery = false;
    this.taxaEntrega = null;
    this.raioEntrega = 0;
    this.pedidoMinimo = null;
  }

  // Gestão de Avaliações
  adicionarAvaliacao(nota: number): void {
    if (nota < 1 || nota > 5) {
      throw new EstabelecimentoInvalidoError('Nota deve estar entre 1 e 5');
    }
    
    const novaMedia = (this.avaliacaoMedia * this.totalAvaliacoes + nota) / (this.totalAvaliacoes + 1);
    this.avaliacaoMedia = Math.round(novaMedia * 10) / 10;
    this.totalAvaliacoes += 1;
  }

  // Gestão de Produtos
  adicionarProduto(produto: Produto): void {
    if (!this.ativo) {
      throw new EstabelecimentoInativoError('Não é possível adicionar produtos a estabelecimento inativo');
    }
    
    if (!this.produtos) {
      this.produtos = [];
    }
    
    produto.estabelecimentoId = this.id || '';
    this.produtos.push(produto);
  }

  // Atualização de dados
  atualizarDados(dados: {
    nome?: string;
    telefone?: string;
    email?: string;
    descricao?: string;
    nomeFantasia?: string;
  }): void {
    if (dados.nome) {
      if (dados.nome.length < 2) {
        throw new EstabelecimentoInvalidoError('Nome deve ter pelo menos 2 caracteres');
      }
      this.nome = dados.nome.trim();
    }
    
    if (dados.telefone !== undefined) {
      if (dados.telefone && !this.validarTelefone(dados.telefone)) {
        throw new TelefoneInvalidoError(dados.telefone);
      }
      this.telefone = dados.telefone?.replace(/\D/g, '') || null;
    }
    
    if (dados.email !== undefined) {
      if (dados.email && !this.validarEmail(dados.email)) {
        throw new EmailInvalidoError(dados.email);
      }
      this.email = dados.email?.toLowerCase().trim() || null;
    }
    
    if (dados.descricao !== undefined) {
      this.descricao = dados.descricao?.trim() || null;
    }
    
    if (dados.nomeFantasia !== undefined) {
      this.nomeFantasia = dados.nomeFantasia?.trim() || null;
    }
  }

  // Estatísticas e métricas
  registrarPedido(valorPedido: number, tempoPreparo: number): void {
    this.totalPedidos += 1;
    this.faturamentoTotal += valorPedido;
    
    // Atualizar tempo médio de preparo
    this.tempoPreparodMedio = Math.round(
      (this.tempoPreparodMedio * (this.totalPedidos - 1) + tempoPreparo) / this.totalPedidos
    );
  }

  // Consultas de negócio
  ehAtivo(): boolean {
    return this.ativo && this.status === StatusEstabelecimento.ATIVO;
  }

  podeReceberPedidos(): boolean {
    return this.ehAtivo() && this.estaAberto;
  }

  temProdutosDisponiveis(): boolean {
    return this.produtos?.some(p => p.ehDisponivel()) || false;
  }

  ehBemAvaliado(): boolean {
    return this.avaliacaoMedia >= 4.0 && this.totalAvaliacoes >= 10;
  }

  temDeliveryHabilitado(): boolean {
    return this.aceitaDelivery && this.raioEntrega > 0;
  }

  podeEntregarEm(latitude: number, longitude: number): boolean {
    if (!this.temDeliveryHabilitado() || !this.latitude || !this.longitude) {
      return false;
    }
    
    const distancia = this.calcularDistancia(latitude, longitude);
    return distancia <= this.raioEntrega;
  }

  private calcularDistancia(lat: number, lng: number): number {
    if (!this.latitude || !this.longitude) return Infinity;
    
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRad(lat - this.latitude);
    const dLng = this.toRad(lng - this.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(this.latitude)) * Math.cos(this.toRad(lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degree: number): number {
    return degree * (Math.PI / 180);
  }

  // Factory Methods
  static criarRestaurante(nome: string, cnpj: string, endereco: string): Estabelecimento {
    return this.criar({
      nome,
      cnpj,
      endereco,
      tipo: TipoEstabelecimento.RESTAURANTE
    });
  }

  static criarMercado(nome: string, cnpj: string, endereco: string): Estabelecimento {
    return this.criar({
      nome,
      cnpj,
      endereco,
      tipo: TipoEstabelecimento.MERCADO
    });
  }

  // Métodos de resumo
  obterResumo(): any {
    return {
      id: this.id,
      nome: this.nome,
      nomeFantasia: this.nomeFantasia,
      cnpj: this.cnpj,
      tipo: this.tipo,
      status: this.status,
      ativo: this.ativo,
      estaAberto: this.estaAberto,
      endereco: this.endereco,
      telefone: this.telefone,
      email: this.email,
      descricao: this.descricao,
      imagemUrl: this.imagemUrl,
      localizacao: this.latitude && this.longitude ? {
        latitude: this.latitude,
        longitude: this.longitude
      } : null,
      avaliacaoMedia: this.avaliacaoMedia,
      totalAvaliacoes: this.totalAvaliacoes,
      totalPedidos: this.totalPedidos,
      faturamentoTotal: this.faturamentoTotal,
      tempoPreparodMedio: this.tempoPreparodMedio,
      aceitaRetirada: this.aceitaRetirada,
      aceitaDelivery: this.aceitaDelivery,
      taxaEntrega: this.taxaEntrega,
      pedidoMinimo: this.pedidoMinimo,
      raioEntrega: this.raioEntrega,
      horarioFuncionamento: this.horarioFuncionamento,
      redesSociais: {
        whatsapp: this.whatsapp,
        instagram: this.instagram,
        facebook: this.facebook,
        website: this.website
      },
      // Flags de negócio
      ehAtivo: this.ehAtivo(),
      podeReceberPedidos: this.podeReceberPedidos(),
      temProdutosDisponiveis: this.temProdutosDisponiveis(),
      ehBemAvaliado: this.ehBemAvaliado(),
      temDeliveryHabilitado: this.temDeliveryHabilitado(),
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
