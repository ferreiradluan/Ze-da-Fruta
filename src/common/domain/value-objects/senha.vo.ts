import { ValueObject } from './cpf.vo';
import { ValidationError } from '../errors/domain-error.base';
import * as bcrypt from 'bcrypt';

/**
 * Password Value Object with validation and encryption
 */
export class Senha extends ValueObject<string> {
  private static readonly MIN_LENGTH = 8;
  private static readonly SALT_ROUNDS = 12;

  protected validate(value: string): void {
    if (!value) {
      throw new SenhaInvalidaError('Senha é obrigatória');
    }

    if (value.length < Senha.MIN_LENGTH) {
      throw new SenhaInvalidaError(`Senha deve ter pelo menos ${Senha.MIN_LENGTH} caracteres`);
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(value)) {
      throw new SenhaInvalidaError('Senha deve conter pelo menos uma letra maiúscula');
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(value)) {
      throw new SenhaInvalidaError('Senha deve conter pelo menos uma letra minúscula');
    }

    // Check for at least one number
    if (!/\d/.test(value)) {
      throw new SenhaInvalidaError('Senha deve conter pelo menos um número');
    }

    // Check for at least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
      throw new SenhaInvalidaError('Senha deve conter pelo menos um caractere especial');
    }

    // Check for common patterns
    if (this.hasCommonPatterns(value)) {
      throw new SenhaInvalidaError('Senha contém padrões muito simples');
    }
  }

  private hasCommonPatterns(password: string): boolean {
    const commonPatterns = [
      /123456/,
      /abcdef/,
      /qwerty/,
      /password/i,
      /(\w)\1{2,}/, // 3 or more repeated characters
    ];

    return commonPatterns.some(pattern => pattern.test(password));
  }

  /**
   * Creates a new Senha from plain text
   */
  static async fromPlainText(plainText: string): Promise<Senha> {
    // Validate first with a temporary instance
    new Senha(plainText);
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(plainText, Senha.SALT_ROUNDS);
    return new Senha(hashedPassword);
  }

  /**
   * Creates a Senha from already hashed password (for loading from database)
   */
  static fromHash(hashedPassword: string): Senha {
    // Skip validation for hashed passwords
    const senha = Object.create(Senha.prototype);
    senha._value = Object.freeze(hashedPassword);
    return senha;
  }
  /**
   * Verifies a plain text password against this hashed password
   */
  async verificar(plainTextPassword: string): Promise<boolean> {
    return bcrypt.compare(plainTextPassword, this._value);
  }

  /**
   * Checks if the password needs to be rehashed (due to salt rounds change)
   */
  needsRehash(): boolean {
    try {
      return bcrypt.getRounds(this._value) < Senha.SALT_ROUNDS;
    } catch {
      return false;
    }
  }

  /**
   * Returns the strength score of the password (0-100)
   */
  static getStrengthScore(plainText: string): number {
    let score = 0;

    // Length score (up to 25 points)
    score += Math.min(plainText.length * 2, 25);

    // Character variety (up to 40 points)
    if (/[a-z]/.test(plainText)) score += 10;
    if (/[A-Z]/.test(plainText)) score += 10;
    if (/\d/.test(plainText)) score += 10;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(plainText)) score += 10;

    // Complexity bonus (up to 35 points)
    const uniqueChars = new Set(plainText).size;
    score += Math.min(uniqueChars * 2, 20);

    // Pattern penalties
    if (/(.)\1{2,}/.test(plainText)) score -= 10; // Repeated characters
    if (/123|abc|qwe/i.test(plainText)) score -= 15; // Sequential patterns

    return Math.max(0, Math.min(100, score));
  }
}

export class SenhaInvalidaError extends ValidationError {
  constructor(message: string) {
    super(message, 'SENHA_INVALIDA', 'senha');
  }

  getUserMessage(): string {
    return 'Senha inválida. Verifique os critérios de segurança.';
  }
}
