import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { StatusSolicitacao } from '../enums/status-solicitacao.enum';
import { TipoSolicitacao } from '../enums/tipo-solicitacao.enum';

@Entity('solicitacoes_parceiro')
export class SolicitacaoParceiro {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    enum: TipoSolicitacao
  })
  tipo: TipoSolicitacao;

  @Column({
    type: 'varchar',
    enum: StatusSolicitacao,
    default: StatusSolicitacao.PENDENTE
  })
  status: StatusSolicitacao;

  // Dados pessoais
  @Column()
  nome: string;

  @Column()
  email: string;

  @Column()
  telefone: string;

  @Column()
  cpf: string;

  // Dados específicos para lojista
  @Column({ nullable: true })
  nomeEstabelecimento?: string;

  @Column({ nullable: true })
  cnpj?: string;

  @Column({ nullable: true })
  descricaoNegocio?: string;

  // Dados específicos para entregador
  @Column({ nullable: true })
  tipoVeiculo?: string;

  @Column({ nullable: true })
  modeloVeiculo?: string;

  @Column({ nullable: true })
  placaVeiculo?: string;

  @Column({ nullable: true })
  numeroCNH?: string;

  // Endereço
  @Column()
  endereco: string;

  @Column()
  numeroEndereco: string;

  @Column({ nullable: true })
  complemento?: string;

  @Column()
  bairro: string;

  @Column()
  cidade: string;

  @Column()
  estado: string;

  @Column()
  cep: string;

  // Observações do candidato
  @Column({ type: 'text', nullable: true })
  observacoes?: string;

  // Dados de análise (preenchidos pelo admin)
  @Column({ nullable: true })
  analisadoPorId?: string;

  @Column({ type: 'text', nullable: true })
  motivoRejeicao?: string;

  @Column({ type: 'datetime', nullable: true })
  dataAnalise?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Métodos de negócio
  static criarSolicitacaoLojista(dados: {
    nome: string;
    email: string;
    telefone: string;
    cpf: string;
    nomeEstabelecimento: string;
    cnpj: string;
    descricaoNegocio: string;
    endereco: string;
    numeroEndereco: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
    observacoes?: string;
  }): SolicitacaoParceiro {
    const solicitacao = new SolicitacaoParceiro();
    
    solicitacao.tipo = TipoSolicitacao.LOJISTA;
    solicitacao.status = StatusSolicitacao.PENDENTE;
    
    // Dados pessoais
    solicitacao.nome = dados.nome;
    solicitacao.email = dados.email;
    solicitacao.telefone = dados.telefone;
    solicitacao.cpf = dados.cpf;
    
    // Dados do estabelecimento
    solicitacao.nomeEstabelecimento = dados.nomeEstabelecimento;
    solicitacao.cnpj = dados.cnpj;
    solicitacao.descricaoNegocio = dados.descricaoNegocio;
    
    // Endereço
    solicitacao.endereco = dados.endereco;
    solicitacao.numeroEndereco = dados.numeroEndereco;
    solicitacao.complemento = dados.complemento;
    solicitacao.bairro = dados.bairro;
    solicitacao.cidade = dados.cidade;
    solicitacao.estado = dados.estado;
    solicitacao.cep = dados.cep;
    
    // Observações
    solicitacao.observacoes = dados.observacoes;
    
    return solicitacao;
  }

  static criarSolicitacaoEntregador(dados: {
    nome: string;
    email: string;
    telefone: string;
    cpf: string;
    tipoVeiculo: string;
    modeloVeiculo: string;
    placaVeiculo: string;
    numeroCNH: string;
    endereco: string;
    numeroEndereco: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
    observacoes?: string;
  }): SolicitacaoParceiro {
    const solicitacao = new SolicitacaoParceiro();
    
    solicitacao.tipo = TipoSolicitacao.ENTREGADOR;
    solicitacao.status = StatusSolicitacao.PENDENTE;
    
    // Dados pessoais
    solicitacao.nome = dados.nome;
    solicitacao.email = dados.email;
    solicitacao.telefone = dados.telefone;
    solicitacao.cpf = dados.cpf;
    
    // Dados do veículo
    solicitacao.tipoVeiculo = dados.tipoVeiculo;
    solicitacao.modeloVeiculo = dados.modeloVeiculo;
    solicitacao.placaVeiculo = dados.placaVeiculo;
    solicitacao.numeroCNH = dados.numeroCNH;
    
    // Endereço
    solicitacao.endereco = dados.endereco;
    solicitacao.numeroEndereco = dados.numeroEndereco;
    solicitacao.complemento = dados.complemento;
    solicitacao.bairro = dados.bairro;
    solicitacao.cidade = dados.cidade;
    solicitacao.estado = dados.estado;
    solicitacao.cep = dados.cep;
    
    // Observações
    solicitacao.observacoes = dados.observacoes;
    
    return solicitacao;
  }

  marcarComoEmAnalise(analisadoPorId: string): void {
    if (this.status !== StatusSolicitacao.PENDENTE) {
      throw new Error('Apenas solicitações pendentes podem ser colocadas em análise');
    }
    
    this.status = StatusSolicitacao.EM_ANALISE;
    this.analisadoPorId = analisadoPorId;
    this.dataAnalise = new Date();
  }

  aprovar(analisadoPorId: string): void {
    if (this.status !== StatusSolicitacao.EM_ANALISE && this.status !== StatusSolicitacao.PENDENTE) {
      throw new Error('Apenas solicitações pendentes ou em análise podem ser aprovadas');
    }
    
    this.status = StatusSolicitacao.APROVADA;
    this.analisadoPorId = analisadoPorId;
    this.dataAnalise = new Date();
  }

  rejeitar(analisadoPorId: string, motivo: string): void {
    if (this.status !== StatusSolicitacao.EM_ANALISE && this.status !== StatusSolicitacao.PENDENTE) {
      throw new Error('Apenas solicitações pendentes ou em análise podem ser rejeitadas');
    }
    
    this.status = StatusSolicitacao.REJEITADA;
    this.analisadoPorId = analisadoPorId;
    this.motivoRejeicao = motivo;
    this.dataAnalise = new Date();
  }

  cancelar(): void {
    if (this.status === StatusSolicitacao.APROVADA) {
      throw new Error('Não é possível cancelar uma solicitação já aprovada');
    }
    
    this.status = StatusSolicitacao.CANCELADA;
  }
}
