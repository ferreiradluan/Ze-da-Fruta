/**
 * Base interface for domain repositories
 */
export interface IDomainRepository<T, ID> {
  /**
   * Finds an entity by its ID
   */
  findById(id: ID): Promise<T | null>;

  /**
   * Saves an entity (create or update)
   */
  save(entity: T): Promise<T>;

  /**
   * Removes an entity
   */
  remove(entity: T): Promise<void>;

  /**
   * Removes an entity by its ID
   */
  removeById(id: ID): Promise<void>;

  /**
   * Checks if an entity exists by ID
   */
  exists(id: ID): Promise<boolean>;

  /**
   * Gets the total count of entities
   */
  count(): Promise<number>;
}

/**
 * Pagination interface
 */
export interface IPagination {
  page: number;
  limit: number;
  offset?: number;
}

/**
 * Pagination result interface
 */
export interface IPaginationResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Base interface for repositories with pagination support
 */
export interface IPaginatedRepository<T, ID> extends IDomainRepository<T, ID> {
  /**
   * Finds entities with pagination
   */
  findMany(pagination: IPagination): Promise<IPaginationResult<T>>;
}

/**
 * Sort direction enum
 */
export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

/**
 * Sort criteria interface
 */
export interface ISortCriteria {
  field: string;
  direction: SortDirection;
}

/**
 * Filter criteria interface
 */
export interface IFilterCriteria {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'notIn';
  value: any;
}

/**
 * Query options interface
 */
export interface IQueryOptions {
  pagination?: IPagination;
  sort?: ISortCriteria[];
  filters?: IFilterCriteria[];
}

/**
 * Base interface for repositories with advanced querying
 */
export interface IAdvancedRepository<T, ID> extends IPaginatedRepository<T, ID> {
  /**
   * Finds entities with advanced query options
   */
  findWithOptions(options: IQueryOptions): Promise<IPaginationResult<T>>;
}

/**
 * Base interface for aggregate repositories with domain events
 */
export interface IAggregateRepository<T> extends IAdvancedRepository<T, string> {
  /**
   * Saves an aggregate and dispatches its domain events
   */
  saveAggregate(aggregate: T): Promise<T>;

  /**
   * Finds an aggregate by ID and loads its domain events
   */
  findAggregateById(id: string): Promise<T | null>;

  /**
   * Removes an aggregate and dispatches domain events
   */
  removeAggregate(aggregate: T): Promise<void>;
}
