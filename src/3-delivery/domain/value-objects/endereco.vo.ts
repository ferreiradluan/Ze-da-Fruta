export class EnderecoVO {
  private readonly _rua: string;
  private readonly _numero: string;
  private readonly _complemento?: string;
  private readonly _bairro: string;
  private readonly _cidade: string;
  private readonly _estado: string;
  private readonly _cep: string;

  constructor(
    rua: string,
    numero: string,
    bairro: string,
    cidade: string,
    estado: string,
    cep: string,
    complemento?: string
  ) {
    this.validar(rua, numero, bairro, cidade, estado, cep);
    this._rua = rua.trim();
    this._numero = numero.trim();
    this._bairro = bairro.trim();
    this._cidade = cidade.trim();
    this._estado = estado.toUpperCase().trim();
    this._cep = this.limparCep(cep);
    this._complemento = complemento?.trim();
  }

  private validar(rua: string, numero: string, bairro: string, cidade: string, estado: string, cep: string): void {
    if (!rua?.trim()) throw new Error('Rua é obrigatória');
    if (!numero?.trim()) throw new Error('Número é obrigatório');
    if (!bairro?.trim()) throw new Error('Bairro é obrigatório');
    if (!cidade?.trim()) throw new Error('Cidade é obrigatória');
    if (!estado?.trim()) throw new Error('Estado é obrigatório');
    if (!cep?.trim()) throw new Error('CEP é obrigatório');

    if (estado.length !== 2) throw new Error('Estado deve ter 2 caracteres');
    if (!this.validarCep(cep)) throw new Error('CEP inválido');
  }

  private validarCep(cep: string): boolean {
    const cepLimpo = this.limparCep(cep);
    return /^\d{8}$/.test(cepLimpo);
  }

  private limparCep(cep: string): string {
    return cep.replace(/[^\d]/g, '');
  }

  get rua(): string { return this._rua; }
  get numero(): string { return this._numero; }
  get complemento(): string | undefined { return this._complemento; }
  get bairro(): string { return this._bairro; }
  get cidade(): string { return this._cidade; }
  get estado(): string { return this._estado; }
  get cep(): string { return this._cep; }

  get cepFormatado(): string {
    return this._cep.replace(/^(\d{5})(\d{3})$/, '$1-$2');
  }

  get enderecoCompleto(): string {
    const complementoTexto = this._complemento ? `, ${this._complemento}` : '';
    return `${this._rua}, ${this._numero}${complementoTexto}, ${this._bairro}, ${this._cidade} - ${this._estado}`;
  }

  ehSameEstado(outro: EnderecoVO): boolean {
    return this._estado === outro._estado;
  }

  ehSameCidade(outro: EnderecoVO): boolean {
    return this._cidade === outro._cidade && this.ehSameEstado(outro);
  }

  calcularDistancia(outro: EnderecoVO): number {
    // Implementação básica - em produção usaria APIs de geolocalização
    if (this.ehSameCidade(outro)) return 5; // 5km dentro da mesma cidade
    if (this.ehSameEstado(outro)) return 50; // 50km mesmo estado
    return 500; // 500km estados diferentes
  }

  equals(outro: EnderecoVO): boolean {
    return this._rua === outro._rua &&
           this._numero === outro._numero &&
           this._bairro === outro._bairro &&
           this._cidade === outro._cidade &&
           this._estado === outro._estado &&
           this._cep === outro._cep;
  }
  toString(): string {
    const complementoTexto = this._complemento ? `, ${this._complemento}` : '';
    return `${this._rua}, ${this._numero}${complementoTexto}, ${this._bairro}, ${this._cidade} - ${this._estado}, CEP: ${this.cepFormatado}`;
  }

  static fromString(enderecoString: string): EnderecoVO {
    const partes = enderecoString.split(',').map(p => p.trim());
    if (partes.length < 4) {
      throw new Error('Formato de endereço inválido');
    }
    
    return new EnderecoVO(
      partes[0] || '',
      partes[1] || '',
      partes[2] || '',
      partes[3]?.split(' - ')[0] || '',
      'SP', // Estado padrão
      '00000-000' // CEP padrão
    );
  }

  static criar(dados: {
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
    complemento?: string;
  }): EnderecoVO {
    return new EnderecoVO(
      dados.rua,
      dados.numero,
      dados.bairro,
      dados.cidade,
      dados.estado,
      dados.cep,
      dados.complemento
    );
  }
}
}
