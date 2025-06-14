export class Dinheiro {
  constructor(private readonly _valor: number) {
    if (_valor < 0) {
      throw new Error('Valor não pode ser negativo');
    }
  }

  get valor(): number {
    return this._valor;
  }

  equals(outro: Dinheiro): boolean {
    return this._valor === outro._valor;
  }

  somar(outro: Dinheiro): Dinheiro {
    return new Dinheiro(this._valor + outro._valor);
  }

  subtrair(outro: Dinheiro): Dinheiro {
    return new Dinheiro(this._valor - outro._valor);
  }

  toString(): string {
    return `R$ ${this._valor.toFixed(2)}`;
  }
}
