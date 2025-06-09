import { 
  IAdvancedRepository,
  IPaginationResult,
  IQueryOptions 
} from '../../../common/domain/repositories/domain-repository.interface';
import { Usuario, TipoUsuario, StatusUsuario } from '../entities/usuario.entity';

/**
 * Aggregate repository interface for entities that emit domain events
 */
export interface IAggregateRepository<T> extends IAdvancedRepository<T, string> {
  /**
   * Saves an aggregate and dispatches its domain events
   */
  saveAggregate(aggregate: T): Promise<T>;
}

/**
 * Repository interface for Usuario entity
 * Defines all domain-specific data access methods
 */
export interface IUsuarioRepository extends IAggregateRepository<Usuario> {
  /**
   * Finds a user by email
   */
  findByEmail(email: string): Promise<Usuario | null>;

  /**
   * Finds a user by CPF
   */
  findByCpf(cpf: string): Promise<Usuario | null>;

  /**
   * Checks if email is already registered
   */
  emailExists(email: string): Promise<boolean>;

  /**
   * Checks if CPF is already registered
   */
  cpfExists(cpf: string): Promise<boolean>;

  /**
   * Finds users by type
   */
  findByTipo(tipo: TipoUsuario): Promise<Usuario[]>;

  /**
   * Finds users by status
   */
  findByStatus(status: StatusUsuario): Promise<Usuario[]>;

  /**
   * Finds users by type and status
   */
  findByTipoAndStatus(tipo: TipoUsuario, status: StatusUsuario): Promise<Usuario[]>;

  /**
   * Finds active users
   */
  findActiveUsers(): Promise<Usuario[]>;

  /**
   * Finds users with expired password reset tokens
   */
  findUsersWithExpiredResetTokens(): Promise<Usuario[]>;

  /**
   * Finds users suspended until a certain date
   */
  findSuspendedUsersUntil(date: Date): Promise<Usuario[]>;

  /**
   * Search users by name or email
   */
  searchByNameOrEmail(searchTerm: string): Promise<Usuario[]>;

  /**
   * Get users with pagination and filters
   */
  findWithFilters(options: IQueryOptions): Promise<IPaginationResult<Usuario>>;

  /**
   * Count users by type
   */
  countByTipo(tipo: TipoUsuario): Promise<number>;

  /**
   * Count users by status
   */
  countByStatus(status: StatusUsuario): Promise<number>;

  /**
   * Find users who haven't logged in since a date
   */
  findInactiveUsersSince(date: Date): Promise<Usuario[]>;

  /**
   * Find users with specific roles
   */
  findUsersWithRoles(roleNames: string[]): Promise<Usuario[]>;

  /**
   * Find users created in date range
   */
  findUsersCreatedBetween(startDate: Date, endDate: Date): Promise<Usuario[]>;
}
