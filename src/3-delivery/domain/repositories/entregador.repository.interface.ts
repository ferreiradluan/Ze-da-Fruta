import { Entregador, StatusEntregador, StatusDisponibilidade } from '../entities/entregador.entity';
import { EnderecoVO } from '../value-objects/endereco.vo';

/**
 * Repository interface for Entregador entity
 * Defines all domain-specific data access methods for delivery drivers
 */
export interface IEntregadorRepository {
  /**
   * Busca entregador por ID
   */
  buscarPorId(id: string): Promise<Entregador | null>;

  /**
   * Busca entregador por email
   */
  buscarPorEmail(email: string): Promise<Entregador | null>;

  /**
   * Busca entregador por telefone
   */
  buscarPorTelefone(telefone: string): Promise<Entregador | null>;

  /**
   * Busca entregadores disponíveis
   */
  buscarDisponiveis(): Promise<Entregador[]>;

  /**
   * Busca entregadores próximos a um endereço
   */
  buscarProximosAoEndereco(endereco: EnderecoVO, raioKm?: number): Promise<Entregador[]>;

  /**
   * Busca entregadores por status
   */
  buscarPorStatus(status: StatusEntregador): Promise<Entregador[]>;

  /**
   * Busca entregadores por disponibilidade
   */
  buscarPorDisponibilidade(disponibilidade: StatusDisponibilidade): Promise<Entregador[]>;

  /**
   * Salva entregador (create ou update)
   */
  salvar(entregador: Entregador): Promise<Entregador>;

  /**
   * Lista todos os entregadores
   */
  listarTodos(): Promise<Entregador[]>;

  /**
   * Busca entregadores ativos
   */
  buscarAtivos(): Promise<Entregador[]>;

  /**
   * Busca entregadores com avaliação mínima
   */
  buscarComAvaliacaoMinima(avaliacaoMinima: number): Promise<Entregador[]>;

  /**
   * Busca entregadores por tipo de veículo
   */
  buscarPorTipoVeiculo(tipoVeiculo: string): Promise<Entregador[]>;

  /**
   * Busca entregadores com localização atualizada
   */
  buscarComLocalizacaoAtualizada(): Promise<Entregador[]>;

  /**
   * Busca entregadores inativos há muito tempo
   */
  buscarInativosHaMais(horas: number): Promise<Entregador[]>;

  /**
   * Remove entregador
   */
  remover(id: string): Promise<void>;

  /**
   * Verifica se email já existe
   */
  emailExiste(email: string, excludeId?: string): Promise<boolean>;

  /**
   * Verifica se telefone já existe
   */
  telefoneExiste(telefone: string, excludeId?: string): Promise<boolean>;

  /**
   * Conta total de entregadores ativos
   */
  contarAtivos(): Promise<number>;

  /**
   * Busca entregadores com estatísticas
   */
  buscarComEstatisticas(): Promise<Entregador[]>;
}
