import { ValueObject } from './cpf.vo';
import { ValidationError } from '../errors/domain-error.base';

/**
 * CEP Value Object with validation
 */
export class CEP extends ValueObject<string> {
  protected validate(value: string): void {
    if (!value) {
      throw new CEPInvalidoError('CEP é obrigatório');
    }

    const cleanCEP = value.replace(/\D/g, '');
    
    if (cleanCEP.length !== 8) {
      throw new CEPInvalidoError('CEP deve ter 8 dígitos');
    }

    // Check for known invalid patterns
    if (/^(\d)\1{7}$/.test(cleanCEP)) {
      throw new CEPInvalidoError('CEP não pode ter todos os dígitos iguais');
    }

    // Basic range validation (Brazilian CEP ranges from 01000-000 to 99999-999)
    const cepNumber = parseInt(cleanCEP);
    if (cepNumber < 1000000 || cepNumber > 99999999) {
      throw new CEPInvalidoError('CEP fora da faixa válida');
    }
  }

  /**
   * Returns formatted CEP (xxxxx-xxx)
   */
  toFormatted(): string {
    const clean = this._value.replace(/\D/g, '');
    return clean.replace(/(\d{5})(\d{3})/, '$1-$2');
  }

  /**
   * Returns clean CEP (numbers only)
   */
  toClean(): string {
    return this._value.replace(/\D/g, '');
  }

  /**
   * Returns the first 5 digits (main area code)
   */
  getAreaCode(): string {
    return this.toClean().substring(0, 5);
  }

  /**
   * Returns the last 3 digits (sub-area code)
   */
  getSubAreaCode(): string {
    return this.toClean().substring(5, 8);
  }
}

export class CEPInvalidoError extends ValidationError {
  constructor(message: string) {
    super(message, 'CEP_INVALIDO', 'cep');
  }

  getUserMessage(): string {
    return 'CEP inválido. Verifique os dados informados.';
  }
}
