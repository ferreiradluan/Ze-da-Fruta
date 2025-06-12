/**
 * Value Object Dinheiro
 * 
 * Responsabilidades:
 * - Encapsular valor monetário e moeda
 * - Garantir imutabilidade
 * - Fornecer operações matemáticas seguras
 * - Validar valores monetários
 */
export class Dinheiro {
  private readonly _valor: number;
  private readonly _moeda: string;

  private constructor(valor: number, moeda: string = 'BRL') {
    if (valor < 0) {
      throw new Error('Valor monetário não pode ser negativo');
    }

    if (!moeda || moeda.length !== 3) {
      throw new Error('Moeda deve ter 3 caracteres (ex: BRL, USD)');
    }

    // Arredondar para 2 casas decimais para evitar problemas de precisão
    this._valor = Math.round(valor * 100) / 100;
    this._moeda = moeda.toUpperCase();
  }

  get valor(): number {
    return this._valor;
  }

  get moeda(): string {
    return this._moeda;
  }

  /**
   * Soma dois valores monetários
   */
  somar(outro: Dinheiro): Dinheiro {
    this.validarMoeda(outro);
    return new Dinheiro(this._valor + outro._valor, this._moeda);
  }

  /**
   * Subtrai dois valores monetários
   */
  subtrair(outro: Dinheiro): Dinheiro {
    this.validarMoeda(outro);
    const resultado = this._valor - outro._valor;
    
    if (resultado < 0) {
      throw new Error('O resultado da subtração não pode ser negativo');
    }
    
    return new Dinheiro(resultado, this._moeda);
  }

  /**
   * Multiplica por um fator
   */
  multiplicar(fator: number): Dinheiro {
    if (fator < 0) {
      throw new Error('Fator de multiplicação não pode ser negativo');
    }
    
    return new Dinheiro(this._valor * fator, this._moeda);
  }

  /**
   * Calcula porcentagem do valor
   */
  porcentagem(percentual: number): Dinheiro {
    if (percentual < 0 || percentual > 100) {
      throw new Error('Percentual deve estar entre 0 e 100');
    }
    
    return new Dinheiro((this._valor * percentual) / 100, this._moeda);
  }

  /**
   * Verifica igualdade entre valores monetários
   */
  equals(outro: Dinheiro): boolean {
    return this._valor === outro._valor && this._moeda === outro._moeda;
  }

  /**
   * Verifica se é maior que outro valor
   */
  maiorQue(outro: Dinheiro): boolean {
    this.validarMoeda(outro);
    return this._valor > outro._valor;
  }

  /**
   * Verifica se é menor que outro valor
   */
  menorQue(outro: Dinheiro): boolean {
    this.validarMoeda(outro);
    return this._valor < outro._valor;
  }

  /**
   * Verifica se é maior ou igual a outro valor
   */
  maiorOuIgualQue(outro: Dinheiro): boolean {
    this.validarMoeda(outro);
    return this._valor >= outro._valor;
  }

  /**
   * Verifica se é menor ou igual a outro valor
   */
  menorOuIgualQue(outro: Dinheiro): boolean {
    this.validarMoeda(outro);
    return this._valor <= outro._valor;
  }

  /**
   * Converte para string formatada
   */
  toString(): string {
    return `${this._moeda} ${this._valor.toFixed(2)}`;
  }

  /**
   * Converte para formato brasileiro (R$ 0,00)
   */
  formatarBRL(): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(this._valor);
  }

  /**
   * Converte para centavos (usado pelo Stripe)
   */
  emCentavos(): number {
    return Math.round(this._valor * 100);
  }

  /**
   * Valida se as moedas são compatíveis
   */
  private validarMoeda(outro: Dinheiro): void {
    if (this._moeda !== outro._moeda) {
      throw new Error(`Moedas incompatíveis: ${this._moeda} e ${outro._moeda}`);
    }
  }

  // ===================================
  // FACTORY METHODS
  // ===================================

  /**
   * Cria um novo valor monetário
   */
  static criar(valor: number, moeda: string = 'BRL'): Dinheiro {
    return new Dinheiro(valor, moeda);
  }

  /**
   * Cria valor monetário a partir de centavos (usado pelo Stripe)
   */
  static deCentavos(centavos: number, moeda: string = 'BRL'): Dinheiro {
    return new Dinheiro(centavos / 100, moeda);
  }

  /**
   * Cria valor monetário zero
   */
  static zero(moeda: string = 'BRL'): Dinheiro {
    return new Dinheiro(0, moeda);
  }
}
