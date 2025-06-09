import { ValidationError } from '../errors/domain-error.base';

/**
 * Base class for Value Objects following DDD principles
 */
export abstract class ValueObject<T> {
  protected readonly _value: T;

  constructor(value: T) {
    this.validate(value);
    this._value = Object.freeze(value);
  }

  /**
   * Gets the underlying value
   */
  get value(): T {
    return this._value;
  }

  /**
   * Validates the value object's constraints
   */
  protected abstract validate(value: T): void;

  /**
   * Checks equality with another value object
   */
  equals(other: ValueObject<T>): boolean {
    if (!other || other.constructor !== this.constructor) {
      return false;
    }
    return this.isEqual(this._value, other._value);
  }

  /**
   * Deep equality check for complex values
   */
  private isEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;

    if (typeof a === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      
      if (keysA.length !== keysB.length) return false;
      
      return keysA.every(key => this.isEqual(a[key], b[key]));
    }

    return false;
  }

  /**
   * Returns string representation
   */
  toString(): string {
    return String(this._value);
  }

  /**
   * Returns JSON representation
   */
  toJSON(): T {
    return this._value;
  }
}

/**
 * CPF Value Object with validation
 */
export class CPF extends ValueObject<string> {
  protected validate(value: string): void {
    if (!value) {
      throw new CPFInvalidoError('CPF é obrigatório');
    }

    const cleanCPF = value.replace(/\D/g, '');
    
    if (cleanCPF.length !== 11) {
      throw new CPFInvalidoError('CPF deve ter 11 dígitos');
    }

    // Check for known invalid patterns
    if (/^(\d)\1{10}$/.test(cleanCPF)) {
      throw new CPFInvalidoError('CPF não pode ter todos os dígitos iguais');
    }

    // Validate CPF algorithm
    if (!this.isValidCPF(cleanCPF)) {
      throw new CPFInvalidoError('CPF inválido');
    }
  }

  private isValidCPF(cpf: string): boolean {
    // Calculate first digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf[i]) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf[9])) return false;

    // Calculate second digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf[i]) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    return remainder === parseInt(cpf[10]);
  }

  /**
   * Returns formatted CPF (xxx.xxx.xxx-xx)
   */
  toFormatted(): string {
    const clean = this._value.replace(/\D/g, '');
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  /**
   * Returns clean CPF (numbers only)
   */
  toClean(): string {
    return this._value.replace(/\D/g, '');
  }
}

export class CPFInvalidoError extends ValidationError {
  constructor(message: string) {
    super(message, 'CPF_INVALIDO', 'cpf');
  }

  getUserMessage(): string {
    return 'CPF inválido. Verifique os dados informados.';
  }
}
