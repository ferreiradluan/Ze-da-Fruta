export class Dinheiro {
  constructor(
    public readonly valor: number,
    public readonly moeda: string = 'BRL'
  ) {
    if (valor < 0) {
      throw new Error('Valor não pode ser negativo');
    }
    if (!moeda || moeda.trim().length === 0) {
      throw new Error('Moeda é obrigatória');
    }
  }

  static criar(valor: number, moeda: string = 'BRL'): Dinheiro {
    return new Dinheiro(valor, moeda);
  }

  somar(outro: Dinheiro): Dinheiro {
    if (this.moeda !== outro.moeda) {
      throw new Error('Não é possível somar valores com moedas diferentes');
    }
    return new Dinheiro(this.valor + outro.valor, this.moeda);
  }
  subtrair(outro: Dinheiro): Dinheiro {
    if (this.moeda !== outro.moeda) {
      throw new Error('Não é possível subtrair valores com moedas diferentes');
    }
    return new Dinheiro(this.valor - outro.valor, this.moeda);
  }

  multiplicar(fator: number): Dinheiro {
    if (fator < 0) {
      throw new Error('Fator de multiplicação não pode ser negativo');
    }
    return new Dinheiro(this.valor * fator, this.moeda);
  }

  aplicarDesconto(percentual: number): Dinheiro {
    if (percentual < 0 || percentual > 100) {
      throw new Error('Percentual deve estar entre 0 e 100');
    }
    const valorDesconto = this.valor * (percentual / 100);
    return new Dinheiro(this.valor - valorDesconto, this.moeda);
  }
  formatado(): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: this.moeda
    }).format(this.valor);
  }

  toString(): string {
    return this.formatado();
  }

  equals(outro: Dinheiro): boolean {
    return this.valor === outro.valor && this.moeda === outro.moeda;
  }
}
