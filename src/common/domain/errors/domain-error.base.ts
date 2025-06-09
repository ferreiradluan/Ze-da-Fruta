/**
 * Base class for all domain errors
 * Provides common functionality for domain-specific exceptions
 */
export abstract class DomainError extends Error {
  public readonly code: string;
  public readonly timestamp: Date;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    code: string,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.timestamp = new Date();
    this.context = context;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Returns a serializable representation of the error
   */
  toJson(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack,
    };
  }

  /**
   * Returns a user-friendly message
   */
  abstract getUserMessage(): string;
}

/**
 * Base class for business rule validation errors
 */
export abstract class BusinessRuleViolationError extends DomainError {
  constructor(
    message: string,
    code: string,
    context?: Record<string, any>
  ) {
    super(message, code, context);
  }
}

/**
 * Base class for entity not found errors
 */
export abstract class EntityNotFoundError extends DomainError {
  constructor(
    entityName: string,
    identifier: string | number,
    context?: Record<string, any>
  ) {
    super(
      `${entityName} with identifier '${identifier}' was not found`,
      `${entityName.toUpperCase()}_NOT_FOUND`,
      { entityName, identifier, ...context }
    );
  }

  getUserMessage(): string {
    return `O item solicitado não foi encontrado.`;
  }
}

/**
 * Base class for validation errors
 */
export abstract class ValidationError extends DomainError {
  public readonly field?: string;

  constructor(
    message: string,
    code: string,
    field?: string,
    context?: Record<string, any>
  ) {
    super(message, code, context);
    this.field = field;
  }
}
