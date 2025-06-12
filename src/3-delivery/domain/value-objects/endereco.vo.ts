export class EnderecoVO {
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;

  constructor(
    rua: string,
    numero: string,
    bairro: string,
    cidade: string,
    estado: string,
    cep: string,
    complemento?: string
  ) {
    this.rua = rua;
    this.numero = numero;
    this.bairro = bairro;
    this.cidade = cidade;
    this.estado = estado;
    this.cep = cep;
    this.complemento = complemento;
  }

  toString(): string {
    const complementoTexto = this.complemento ? `, ${this.complemento}` : '';
    return `${this.rua}, ${this.numero}${complementoTexto}, ${this.bairro}, ${this.cidade} - ${this.estado}, CEP: ${this.cep}`;
  }

  static fromString(enderecoString: string): EnderecoVO {
    // Parse simples - em produção seria mais robusto
    const partes = enderecoString.split(',');
    if (partes.length < 4) {
      throw new Error('Formato de endereço inválido');
    }
    
    return new EnderecoVO(
      partes[0]?.trim() || '',
      partes[1]?.trim() || '',
      partes[2]?.trim() || '',
      partes[3]?.trim() || '',
      'SP', // Estado padrão
      '00000-000' // CEP padrão
    );
  }
}
