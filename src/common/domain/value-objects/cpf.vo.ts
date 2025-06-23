/**
 * Value Object: CPF
 * Encapsula validações e operações relacionadas a CPF
 */
export class CPF {
  private readonly _valor: string;

  constructor(valor: string) {
    if (!valor) {
      throw new Error('CPF é obrigatório');
    }

    const cpfLimpo = this.limparCpf(valor);
    
    if (!this.ehValido(cpfLimpo)) {
      throw new Error('CPF inválido');
    }

    this._valor = cpfLimpo;
  }

  // Factory methods
  static criar(valor: string): CPF {
    return new CPF(valor);
  }

  static tentar(valor: string): { sucesso: boolean; cpf?: CPF; erro?: string } {
    try {
      return {
        sucesso: true,
        cpf: new CPF(valor)
      };
    } catch (error) {
      return {
        sucesso: false,
        erro: error instanceof Error ? error.message : 'CPF inválido'
      };
    }
  }

  // Getters
  get valor(): string {
    return this._valor;
  }

  get formatado(): string {
    return `${this._valor.slice(0, 3)}.${this._valor.slice(3, 6)}.${this._valor.slice(6, 9)}-${this._valor.slice(9)}`;
  }

  get mascarado(): string {
    return `***.**${this._valor.slice(6, 9)}-**`;
  }

  // Validações
  private limparCpf(cpf: string): string {
    return cpf.replace(/\D/g, '');
  }

  private ehValido(cpf: string): boolean {
    // Verificar se tem 11 dígitos
    if (cpf.length !== 11) {
      return false;
    }

    // Verificar se não são todos dígitos iguais
    if (/^(\d)\1{10}$/.test(cpf)) {
      return false;
    }

    // Validar dígitos verificadores
    return this.validarDigitoVerificador(cpf);
  }

  private validarDigitoVerificador(cpf: string): boolean {
    // Calcular primeiro dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpf[i]) * (10 - i);
    }
    
    let resto = soma % 11;
    const primeiroDigito = resto < 2 ? 0 : 11 - resto;

    if (parseInt(cpf[9]) !== primeiroDigito) {
      return false;
    }

    // Calcular segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpf[i]) * (11 - i);
    }
    
    resto = soma % 11;
    const segundoDigito = resto < 2 ? 0 : 11 - resto;

    return parseInt(cpf[10]) === segundoDigito;
  }

  // Comparação
  equals(outro: CPF): boolean {
    return this._valor === outro._valor;
  }

  // Formatação
  toString(): string {
    return this.formatado;
  }

  // Serialização
  paraJSON(): { valor: string; formatado: string } {
    return {
      valor: this._valor,
      formatado: this.formatado
    };
  }
}
