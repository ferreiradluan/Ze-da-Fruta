export class EnderecoVO {
  readonly rua: string;
  readonly numero: string;
  readonly cidade: string;
  readonly cep: string;

  constructor(rua: string, numero: string, cidade: string, cep: string) {
    this.rua = rua;
    this.numero = numero;
    this.cidade = cidade;
    this.cep = cep;
  }

  // Value Object é imutável
  equals(other: EnderecoVO): boolean {
    return this.rua === other.rua &&
           this.numero === other.numero &&
           this.cidade === other.cidade &&
           this.cep === other.cep;
  }

  toString(): string {
    return `${this.rua}, ${this.numero} - ${this.cidade} - ${this.cep}`;
  }
}
