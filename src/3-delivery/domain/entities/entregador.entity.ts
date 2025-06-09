import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/core/base.entity';
import { 
  EntregadorInvalidoError,
  EmailEntregadorInvalidoError,
  TelefoneEntregadorInvalidoError,
  CNHInvalidaError,
  VeiculoInvalidoError,
  AvaliacaoInvalidaError,
  EntregadorIndisponivelError,
  EntregadorInativoError,
  TransicaoStatusEntregadorInvalidaError,
  TransicaoDisponibilidadeInvalidaError,
  EntregadorComEntregasAtivas
} from '../errors/entregador.errors';

export enum StatusEntregador {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
  SUSPENSO = 'SUSPENSO',
}

export enum StatusDisponibilidade {
  DISPONIVEL = 'DISPONIVEL',
  EM_ENTREGA = 'EM_ENTREGA',
  INDISPONIVEL = 'INDISPONIVEL',
}

export enum TipoVeiculo {
  MOTO = 'MOTO',
  BICICLETA = 'BICICLETA',
  CARRO = 'CARRO',
  A_PE = 'A_PE'
}

export interface VeiculoInfo {
  tipo: TipoVeiculo;
  modelo?: string;
  placa?: string;
  ano?: number;
  cor?: string;
}

@Entity()
export class Entregador extends BaseEntity {
  @Column()
  nome: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  telefone: string;

  @Column({ type: 'text', nullable: true })
  fotoPerfil: string | null;

  @Column({
    type: 'text',
    default: StatusEntregador.ATIVO,
  })
  status: StatusEntregador;

  @Column({
    type: 'text',
    default: StatusDisponibilidade.INDISPONIVEL,
  })
  disponibilidade: StatusDisponibilidade;
  @Column('json', { nullable: true })
  veiculo: VeiculoInfo | null;

  @Column({ nullable: true })
  cnh: string | null;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  avaliacaoMedia: number;

  @Column({ default: 0 })
  totalEntregas: number;

  @Column({ default: 0 })
  totalEntregasCompletas: number;

  @Column({ default: 0 })
  totalEntregasCanceladas: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  distanciaPercorrida: number; // em km

  @Column({ type: 'json', nullable: true })
  localizacaoAtual: {
    latitude: number;
    longitude: number;
    atualizadoEm: Date;
  };

  @Column({ type: 'datetime', nullable: true })
  ultimaAtividade: Date;

  // ===== BUSINESS METHODS =====

  /**
   * Valida dados do entregador
   */
  private validar(): void {
    if (!this.nome?.trim()) {
      throw new EntregadorInvalidoError('Nome é obrigatório');
    }

    if (!this.validarEmail(this.email)) {
      throw new EmailEntregadorInvalidoError(this.email);
    }

    if (!this.validarTelefone(this.telefone)) {
      throw new TelefoneEntregadorInvalidoError(this.telefone);
    }

    if (this.cnh && !this.validarCNH(this.cnh)) {
      throw new CNHInvalidaError(this.cnh);
    }

    if (this.veiculo && !this.validarVeiculo(this.veiculo)) {
      throw new VeiculoInvalidoError('Informações do veículo inválidas');
    }

    if (this.avaliacaoMedia < 0 || this.avaliacaoMedia > 5) {
      throw new AvaliacaoInvalidaError(this.avaliacaoMedia);
    }
  }

  private validarEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private validarTelefone(telefone: string): boolean {
    const telefoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
    return telefoneRegex.test(telefone);
  }

  private validarCNH(cnh: string): boolean {
    return cnh.replace(/\D/g, '').length === 11;
  }

  private validarVeiculo(veiculo: VeiculoInfo): boolean {
    if (!Object.values(TipoVeiculo).includes(veiculo.tipo)) {
      return false;
    }

    // Se for moto ou carro, placa é obrigatória
    if ((veiculo.tipo === TipoVeiculo.MOTO || veiculo.tipo === TipoVeiculo.CARRO) && 
        !veiculo.placa?.trim()) {
      return false;
    }

    return true;
  }

  /**
   * Ativa entregador
   */
  ativar(): void {
    if (this.status === StatusEntregador.ATIVO) {
      return; // Já está ativo
    }

    this.status = StatusEntregador.ATIVO;
    this.ultimaAtividade = new Date();
  }

  /**
   * Desativa entregador
   */
  desativar(temEntregasAtivas: boolean = false): void {
    if (temEntregasAtivas) {
      throw new EntregadorComEntregasAtivas(this.id);
    }

    if (this.status === StatusEntregador.INATIVO) {
      return; // Já está inativo
    }

    this.status = StatusEntregador.INATIVO;
    this.disponibilidade = StatusDisponibilidade.INDISPONIVEL;
    this.ultimaAtividade = new Date();
  }

  /**
   * Suspende entregador
   */
  suspender(): void {
    if (this.status === StatusEntregador.SUSPENSO) {
      return; // Já está suspenso
    }

    this.status = StatusEntregador.SUSPENSO;
    this.disponibilidade = StatusDisponibilidade.INDISPONIVEL;
    this.ultimaAtividade = new Date();
  }

  /**
   * Torna entregador disponível
   */
  tornarDisponivel(): void {
    if (this.status !== StatusEntregador.ATIVO) {
      throw new EntregadorInativoError(this.id);
    }

    if (this.disponibilidade === StatusDisponibilidade.EM_ENTREGA) {
      throw new TransicaoDisponibilidadeInvalidaError(this.disponibilidade, StatusDisponibilidade.DISPONIVEL);
    }

    this.disponibilidade = StatusDisponibilidade.DISPONIVEL;
    this.ultimaAtividade = new Date();
  }

  /**
   * Torna entregador indisponível
   */
  tornarIndisponivel(): void {
    this.disponibilidade = StatusDisponibilidade.INDISPONIVEL;
    this.ultimaAtividade = new Date();
  }

  /**
   * Marca como em entrega
   */
  iniciarEntrega(): void {
    if (this.status !== StatusEntregador.ATIVO) {
      throw new EntregadorInativoError(this.id);
    }

    if (this.disponibilidade !== StatusDisponibilidade.DISPONIVEL) {
      throw new EntregadorIndisponivelError(this.id, this.disponibilidade);
    }

    this.disponibilidade = StatusDisponibilidade.EM_ENTREGA;
    this.ultimaAtividade = new Date();
  }

  /**
   * Finaliza entrega
   */
  finalizarEntrega(foiCancelada: boolean = false): void {
    if (this.disponibilidade !== StatusDisponibilidade.EM_ENTREGA) {
      throw new TransicaoDisponibilidadeInvalidaError(this.disponibilidade, StatusDisponibilidade.DISPONIVEL);
    }

    this.totalEntregas++;
    
    if (foiCancelada) {
      this.totalEntregasCanceladas++;
    } else {
      this.totalEntregasCompletas++;
    }

    this.disponibilidade = StatusDisponibilidade.DISPONIVEL;
    this.ultimaAtividade = new Date();
  }

  /**
   * Adiciona avaliação
   */
  adicionarAvaliacao(nota: number): void {
    if (nota < 0 || nota > 5) {
      throw new AvaliacaoInvalidaError(nota);
    }

    const totalAvaliacoes = this.totalEntregasCompletas;
    if (totalAvaliacoes === 0) {
      this.avaliacaoMedia = nota;
    } else {
      // Média ponderada
      this.avaliacaoMedia = ((this.avaliacaoMedia * totalAvaliacoes) + nota) / (totalAvaliacoes + 1);
      this.avaliacaoMedia = Math.round(this.avaliacaoMedia * 100) / 100; // 2 casas decimais
    }
  }

  /**
   * Atualiza localização
   */
  atualizarLocalizacao(latitude: number, longitude: number): void {
    if (this.status !== StatusEntregador.ATIVO) {
      throw new EntregadorInativoError(this.id);
    }

    this.localizacaoAtual = {
      latitude,
      longitude,
      atualizadoEm: new Date()
    };

    this.ultimaAtividade = new Date();
  }

  /**
   * Adiciona distância percorrida
   */
  adicionarDistanciaPercorrida(distancia: number): void {
    if (distancia > 0) {
      this.distanciaPercorrida += distancia;
    }
  }

  /**
   * Atualiza informações do veículo
   */
  atualizarVeiculo(veiculo: VeiculoInfo): void {
    if (!this.validarVeiculo(veiculo)) {
      throw new VeiculoInvalidoError('Informações do veículo inválidas');
    }

    this.veiculo = veiculo;
  }

  // ===== QUERY METHODS =====

  /**
   * Verifica se está disponível para entregas
   */
  estaDisponivel(): boolean {
    return this.status === StatusEntregador.ATIVO && 
           this.disponibilidade === StatusDisponibilidade.DISPONIVEL;
  }

  /**
   * Verifica se está em entrega
   */
  estaEmEntrega(): boolean {
    return this.disponibilidade === StatusDisponibilidade.EM_ENTREGA;
  }

  /**
   * Verifica se está ativo
   */
  estaAtivo(): boolean {
    return this.status === StatusEntregador.ATIVO;
  }

  /**
   * Calcula taxa de sucesso nas entregas
   */
  calcularTaxaSucesso(): number {
    if (this.totalEntregas === 0) return 100;
    
    return Math.round((this.totalEntregasCompletas / this.totalEntregas) * 100);
  }

  /**
   * Calcula taxa de cancelamento
   */
  calcularTaxaCancelamento(): number {
    if (this.totalEntregas === 0) return 0;
    
    return Math.round((this.totalEntregasCanceladas / this.totalEntregas) * 100);
  }

  /**
   * Verifica se tem localização atualizada (últimas 15 min)
   */
  temLocalizacaoAtualizada(): boolean {
    if (!this.localizacaoAtual) return false;
    
    const quinzeMinutosAtras = new Date(Date.now() - 15 * 60 * 1000);
    return new Date(this.localizacaoAtual.atualizadoEm) > quinzeMinutosAtras;
  }

  /**
   * Calcula tempo desde última atividade em minutos
   */
  calcularTempoInatividade(): number {
    if (!this.ultimaAtividade) return 0;
    
    const agora = new Date();
    const diferenca = agora.getTime() - this.ultimaAtividade.getTime();
    return Math.floor(diferenca / (1000 * 60));
  }

  /**
   * Verifica se requer CNH (moto ou carro)
   */
  requerCNH(): boolean {
    return this.veiculo?.tipo === TipoVeiculo.MOTO || 
           this.veiculo?.tipo === TipoVeiculo.CARRO;
  }

  /**
   * Obtém descrição do status
   */
  getStatusDescricao(): string {
    const statusDescricoes = {
      [StatusEntregador.ATIVO]: 'Ativo',
      [StatusEntregador.INATIVO]: 'Inativo',
      [StatusEntregador.SUSPENSO]: 'Suspenso'
    };

    const disponibilidadeDescricoes = {
      [StatusDisponibilidade.DISPONIVEL]: 'Disponível',
      [StatusDisponibilidade.EM_ENTREGA]: 'Em entrega',
      [StatusDisponibilidade.INDISPONIVEL]: 'Indisponível'
    };

    return `${statusDescricoes[this.status]} - ${disponibilidadeDescricoes[this.disponibilidade]}`;
  }

  // ===== FACTORY METHODS =====

  /**
   * Cria novo entregador
   */
  static criar(dados: {
    nome: string;
    email: string;
    telefone: string;
    veiculo?: VeiculoInfo;
    cnh?: string;
  }): Entregador {
    const entregador = new Entregador();
    entregador.nome = dados.nome;
    entregador.email = dados.email;
    entregador.telefone = dados.telefone;
    entregador.veiculo = dados.veiculo || null;
    entregador.cnh = dados.cnh || null;
    entregador.status = StatusEntregador.INATIVO; // Inicia inativo até aprovação
    entregador.disponibilidade = StatusDisponibilidade.INDISPONIVEL;
    entregador.avaliacaoMedia = 0;
    entregador.totalEntregas = 0;
    entregador.totalEntregasCompletas = 0;
    entregador.totalEntregasCanceladas = 0;
    entregador.distanciaPercorrida = 0;
    entregador.ultimaAtividade = new Date();

    entregador.validar();

    return entregador;
  }

  /**
   * Reconstitui entregador do banco de dados
   */
  static reconstituir(dados: Partial<Entregador>): Entregador {
    const entregador = new Entregador();
    Object.assign(entregador, dados);
    return entregador;
  }
}
