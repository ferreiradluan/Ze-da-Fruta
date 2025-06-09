import { DomainError } from '../../../common/domain/errors/domain-error.base';

export class DinheiroInvalidoError extends DomainError {
  constructor(message: string) {
    super(message, 'DINHEIRO_INVALIDO');
  }

  getUserMessage(): string {
    return 'Valor monetário inválido.';
  }
}

export class Dinheiro {
  private static readonly PRECISION = 2;
  private static readonly MOEDAS_SUPORTADAS = ['BRL', 'USD', 'EUR'];

  constructor(
    public readonly valor: number,
    public readonly moeda: string = 'BRL'
  ) {
    this.validar(valor, moeda);
  }

  private validar(valor: number, moeda: string): void {
    if (valor < 0) {
      throw new DinheiroInvalidoError('Valor monetário não pode ser negativo');
    }
    
    if (!Number.isFinite(valor)) {
      throw new DinheiroInvalidoError('Valor monetário deve ser um número válido');
    }

    if (!moeda || moeda.trim().length === 0) {
      throw new DinheiroInvalidoError('Moeda é obrigatória');
    }

    if (!Dinheiro.MOEDAS_SUPORTADAS.includes(moeda)) {
      throw new DinheiroInvalidoError(`Moeda '${moeda}' não é suportada`);
    }

    // Validar precisão decimal
    const decimalPlaces = (valor.toString().split('.')[1] || '').length;
    if (decimalPlaces > Dinheiro.PRECISION) {
      throw new DinheiroInvalidoError(`Valor não pode ter mais de ${Dinheiro.PRECISION} casas decimais`);
    }
  }

  static criar(valor: number, moeda: string = 'BRL'): Dinheiro {
    return new Dinheiro(valor, moeda);
  }

  static zero(moeda: string = 'BRL'): Dinheiro {
    return new Dinheiro(0, moeda);
  }

  static fromCentavos(centavos: number, moeda: string = 'BRL'): Dinheiro {
    return new Dinheiro(centavos / 100, moeda);
  }

  somar(outro: Dinheiro): Dinheiro {
    this.validarMesmaModea(outro);
    return new Dinheiro(
      this.roundToPrecision(this.valor + outro.valor),
      this.moeda
    );
  }

  subtrair(outro: Dinheiro): Dinheiro {
    this.validarMesmaModea(outro);
    const resultado = this.valor - outro.valor;
    if (resultado < 0) {
      throw new DinheiroInvalidoError('Resultado da subtração não pode ser negativo');
    }
    return new Dinheiro(this.roundToPrecision(resultado), this.moeda);
  }

  multiplicar(fator: number): Dinheiro {
    if (fator < 0) {
      throw new DinheiroInvalidoError('Fator de multiplicação não pode ser negativo');
    }
    return new Dinheiro(
      this.roundToPrecision(this.valor * fator),
      this.moeda
    );
  }

  dividir(divisor: number): Dinheiro {
    if (divisor <= 0) {
      throw new DinheiroInvalidoError('Divisor deve ser maior que zero');
    }
    return new Dinheiro(
      this.roundToPrecision(this.valor / divisor),
      this.moeda
    );
  }

  aplicarDesconto(percentual: number): Dinheiro {
    if (percentual < 0 || percentual > 100) {
      throw new DinheiroInvalidoError('Percentual de desconto deve estar entre 0 e 100');
    }
    const fatorDesconto = 1 - (percentual / 100);
    return this.multiplicar(fatorDesconto);
  }

  calcularTaxa(percentual: number): Dinheiro {
    if (percentual < 0) {
      throw new DinheiroInvalidoError('Percentual de taxa não pode ser negativo');
    }
    return this.multiplicar(percentual / 100);
  }

  private roundToPrecision(valor: number): number {
    return Math.round(valor * Math.pow(10, Dinheiro.PRECISION)) / Math.pow(10, Dinheiro.PRECISION);
  }

  private validarMesmaModea(outro: Dinheiro): void {
    if (this.moeda !== outro.moeda) {
      throw new DinheiroInvalidoError(
        `Operação não permitida entre moedas diferentes: ${this.moeda} e ${outro.moeda}`
      );
    }
  }

  // Métodos de comparação
  maiorQue(outro: Dinheiro): boolean {
    this.validarMesmaModea(outro);
    return this.valor > outro.valor;
  }

  menorQue(outro: Dinheiro): boolean {
    this.validarMesmaModea(outro);
    return this.valor < outro.valor;
  }

  maiorOuIgualA(outro: Dinheiro): boolean {
    this.validarMesmaModea(outro);
    return this.valor >= outro.valor;
  }

  menorOuIgualA(outro: Dinheiro): boolean {
    this.validarMesmaModea(outro);
    return this.valor <= outro.valor;
  }

  equals(outro: Dinheiro): boolean {
    return this.valor === outro.valor && this.moeda === outro.moeda;
  }

  ehZero(): boolean {
    return this.valor === 0;
  }

  ehPositivo(): boolean {
    return this.valor > 0;
  }

  // Formatação
  formatado(): string {
    const formatters = {
      'BRL': new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }),
      'USD': new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
      'EUR': new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })
    };

    return formatters[this.moeda as keyof typeof formatters]?.format(this.valor) || 
           `${this.moeda} ${this.valor.toFixed(Dinheiro.PRECISION)}`;
  }

  formatadoSemSimbolo(): string {
    return this.valor.toFixed(Dinheiro.PRECISION);
  }

  get centavos(): number {
    return Math.round(this.valor * 100);
  }

  toString(): string {
    return this.formatado();
  }

  toJSON(): { valor: number; moeda: string; formatado: string } {
    return {
      valor: this.valor,
      moeda: this.moeda,
      formatado: this.formatado()
    };
  }
}
