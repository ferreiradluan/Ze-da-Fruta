/**
 * Value Object: Endereco
 * Encapsula lógica e validações de endereço
 */
export class EnderecoVO {
  private readonly _logradouro: string;
  private readonly _numero: string;
  private readonly _cep: string;
  private readonly _cidade: string;
  private readonly _estado: string;
  private readonly _complemento?: string;
  private readonly _bairro?: string;

  constructor(dados: {
    logradouro: string;
    numero: string;
    cep: string;
    cidade: string;
    estado: string;
    complemento?: string;
    bairro?: string;
  }) {
    // Validações
    this.validarLogradouro(dados.logradouro);
    this.validarNumero(dados.numero);
    this.validarCep(dados.cep);
    this.validarCidade(dados.cidade);
    this.validarEstado(dados.estado);

    this._logradouro = dados.logradouro.trim();
    this._numero = dados.numero.trim();
    this._cep = this.normalizarCep(dados.cep);
    this._cidade = dados.cidade.trim();
    this._estado = dados.estado.trim().toUpperCase();
    this._complemento = dados.complemento?.trim();
    this._bairro = dados.bairro?.trim();
  }

  // Factory methods
  static criar(dados: {
    logradouro: string;
    numero: string;
    cep: string;
    cidade: string;
    estado: string;
    complemento?: string;
    bairro?: string;
  }): EnderecoVO {
    return new EnderecoVO(dados);
  }

  static fromString(enderecoCompleto: string): EnderecoVO {
    // Parse básico de string de endereço
    // Formato esperado: "Rua X, 123, Bairro, Cidade/Estado, CEP: 12345-678"
    const partes = enderecoCompleto.split(',').map(p => p.trim());
    
    if (partes.length < 4) {
      throw new Error('Formato de endereço inválido');
    }

    const [logradouro, numero, bairro, cidadeEstado] = partes;
    const [cidade, estado] = cidadeEstado.split('/').map(p => p.trim());
    
    // Extrair CEP se presente
    const cepMatch = enderecoCompleto.match(/CEP:?\s*(\d{5}-?\d{3})/i);
    const cep = cepMatch ? cepMatch[1] : '00000-000';

    return new EnderecoVO({
      logradouro,
      numero,
      cep,
      cidade,
      estado,
      bairro
    });
  }

  // Getters
  get logradouro(): string {
    return this._logradouro;
  }

  get numero(): string {
    return this._numero;
  }

  get cep(): string {
    return this._cep;
  }

  get cidade(): string {
    return this._cidade;
  }

  get estado(): string {
    return this._estado;
  }

  get complemento(): string | undefined {
    return this._complemento;
  }

  get bairro(): string | undefined {
    return this._bairro;
  }

  // Validações
  ehValido(): boolean {
    try {
      this.validarLogradouro(this._logradouro);
      this.validarNumero(this._numero);
      this.validarCep(this._cep);
      this.validarCidade(this._cidade);
      this.validarEstado(this._estado);
      return true;
    } catch {
      return false;
    }
  }

  // Formatação
  formatado(): string {
    let endereco = `${this._logradouro}, ${this._numero}`;
    
    if (this._complemento) {
      endereco += `, ${this._complemento}`;
    }
    
    if (this._bairro) {
      endereco += `, ${this._bairro}`;
    }
    
    endereco += `, ${this._cidade}/${this._estado}`;
    endereco += `, CEP: ${this._cep}`;
    
    return endereco;
  }

  resumido(): string {
    return `${this._logradouro}, ${this._numero} - ${this._cidade}/${this._estado}`;
  }

  toString(): string {
    return this.formatado();
  }

  // Comparação
  equals(outro: EnderecoVO): boolean {
    return this._logradouro === outro._logradouro &&
           this._numero === outro._numero &&
           this._cep === outro._cep &&
           this._cidade === outro._cidade &&
           this._estado === outro._estado &&
           this._complemento === outro._complemento &&
           this._bairro === outro._bairro;
  }

  // Serialização
  paraJSON(): object {
    return {
      logradouro: this._logradouro,
      numero: this._numero,
      cep: this._cep,
      cidade: this._cidade,
      estado: this._estado,
      complemento: this._complemento,
      bairro: this._bairro
    };
  }

  // Validações privadas
  private validarLogradouro(logradouro: string): void {
    if (!logradouro || logradouro.trim().length < 3) {
      throw new Error('Logradouro deve ter pelo menos 3 caracteres');
    }
    
    if (logradouro.trim().length > 255) {
      throw new Error('Logradouro não pode ter mais de 255 caracteres');
    }
  }

  private validarNumero(numero: string): void {
    if (!numero || numero.trim().length === 0) {
      throw new Error('Número é obrigatório');
    }
    
    if (numero.trim().length > 20) {
      throw new Error('Número não pode ter mais de 20 caracteres');
    }
  }

  private validarCep(cep: string): void {
    if (!cep) {
      throw new Error('CEP é obrigatório');
    }
    
    const cepLimpo = cep.replace(/\D/g, '');
    
    if (cepLimpo.length !== 8) {
      throw new Error('CEP deve ter 8 dígitos');
    }

    // Validação básica de CEP válido (não pode ser todos zeros ou sequência)
    if (cepLimpo === '00000000' || /^(\d)\1{7}$/.test(cepLimpo)) {
      throw new Error('CEP inválido');
    }
  }

  private validarCidade(cidade: string): void {
    if (!cidade || cidade.trim().length < 2) {
      throw new Error('Cidade deve ter pelo menos 2 caracteres');
    }
    
    if (cidade.trim().length > 100) {
      throw new Error('Cidade não pode ter mais de 100 caracteres');
    }
  }

  private validarEstado(estado: string): void {
    if (!estado || estado.trim().length !== 2) {
      throw new Error('Estado deve ter exatamente 2 caracteres');
    }

    const estadosValidos = [
      'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
      'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
      'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    ];

    if (!estadosValidos.includes(estado.trim().toUpperCase())) {
      throw new Error('Estado inválido');
    }
  }

  private normalizarCep(cep: string): string {
    const cepLimpo = cep.replace(/\D/g, '');
    return `${cepLimpo.slice(0, 5)}-${cepLimpo.slice(5)}`;
  }
}
