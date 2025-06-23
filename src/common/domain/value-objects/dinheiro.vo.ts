/**
 * Value Object: Dinheiro
 * Encapsula lógica de operações monetárias
 */
export class Dinheiro {
  private readonly _valor: number;
  private readonly _moeda: string;

  constructor(valor: number, moeda: string = 'BRL') {
    if (valor < 0) {
      throw new Error('Valor monetário não pode ser negativo');
    }
    
    if (!moeda || moeda.length !== 3) {
      throw new Error('Código da moeda deve ter 3 caracteres');
    }

    this._valor = Math.round(valor * 100) / 100; // Arredondar para 2 casas decimais
    this._moeda = moeda.toUpperCase();
  }

  // Factory methods
  static criar(valor: number, moeda: string = 'BRL'): Dinheiro {
    return new Dinheiro(valor, moeda);
  }

  static zero(moeda: string = 'BRL'): Dinheiro {
    return new Dinheiro(0, moeda);
  }

  static fromCentavos(centavos: number, moeda: string = 'BRL'): Dinheiro {
    return new Dinheiro(centavos / 100, moeda);
  }

  // Getters
  get valor(): number {
    return this._valor;
  }

  get moeda(): string {
    return this._moeda;
  }

  get centavos(): number {
    return Math.round(this._valor * 100);
  }

  // Operações matemáticas
  somar(outro: Dinheiro): Dinheiro {
    this.validarMoeda(outro);
    return new Dinheiro(this._valor + outro._valor, this._moeda);
  }

  subtrair(outro: Dinheiro): Dinheiro {
    this.validarMoeda(outro);
    const resultado = this._valor - outro._valor;
    
    if (resultado < 0) {
      throw new Error('Resultado da subtração não pode ser negativo');
    }
    
    return new Dinheiro(resultado, this._moeda);
  }

  multiplicar(fator: number): Dinheiro {
    if (fator < 0) {
      throw new Error('Fator de multiplicação não pode ser negativo');
    }
    
    return new Dinheiro(this._valor * fator, this._moeda);
  }

  dividir(divisor: number): Dinheiro {
    if (divisor <= 0) {
      throw new Error('Divisor deve ser maior que zero');
    }
    
    return new Dinheiro(this._valor / divisor, this._moeda);
  }

  aplicarDesconto(percentual: number): Dinheiro {
    if (percentual < 0 || percentual > 100) {
      throw new Error('Percentual de desconto deve estar entre 0 e 100');
    }
    
    const valorDesconto = this._valor * (percentual / 100);
    return new Dinheiro(this._valor - valorDesconto, this._moeda);
  }

  aplicarAcrescimo(percentual: number): Dinheiro {
    if (percentual < 0) {
      throw new Error('Percentual de acréscimo não pode ser negativo');
    }
    
    const valorAcrescimo = this._valor * (percentual / 100);
    return new Dinheiro(this._valor + valorAcrescimo, this._moeda);
  }

  // Comparações
  equals(outro: Dinheiro): boolean {
    return this._valor === outro._valor && this._moeda === outro._moeda;
  }

  isZero(): boolean {
    return this._valor === 0;
  }

  isPositive(): boolean {
    return this._valor > 0;
  }

  maiorQue(outro: Dinheiro): boolean {
    this.validarMoeda(outro);
    return this._valor > outro._valor;
  }

  menorQue(outro: Dinheiro): boolean {
    this.validarMoeda(outro);
    return this._valor < outro._valor;
  }

  maiorOuIgualA(outro: Dinheiro): boolean {
    this.validarMoeda(outro);
    return this._valor >= outro._valor;
  }

  menorOuIgualA(outro: Dinheiro): boolean {
    this.validarMoeda(outro);
    return this._valor <= outro._valor;
  }

  // Formatação
  toString(): string {
    return this.formatado();
  }

  formatado(): string {
    const simbolos: { [key: string]: string } = {
      'BRL': 'R$',
      'USD': '$',
      'EUR': '€'
    };

    const simbolo = simbolos[this._moeda] || this._moeda;
    return `${simbolo} ${this._valor.toFixed(2).replace('.', ',')}`;
  }

  paraJSON(): { valor: number; moeda: string } {
    return {
      valor: this._valor,
      moeda: this._moeda
    };
  }

  // Validações privadas
  private validarMoeda(outro: Dinheiro): void {
    if (this._moeda !== outro._moeda) {
      throw new Error(`Moedas diferentes: ${this._moeda} vs ${outro._moeda}`);
    }
  }
}
