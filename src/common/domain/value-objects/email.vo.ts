/**
 * Value Object: Email
 * Encapsula validações e operações relacionadas a email
 */
export class Email {
  private readonly _valor: string;

  constructor(valor: string) {
    if (!valor) {
      throw new Error('Email é obrigatório');
    }

    const emailLimpo = valor.trim().toLowerCase();
    
    if (!this.ehValido(emailLimpo)) {
      throw new Error('Email inválido');
    }

    this._valor = emailLimpo;
  }

  // Factory methods
  static criar(valor: string): Email {
    return new Email(valor);
  }

  static tentar(valor: string): { sucesso: boolean; email?: Email; erro?: string } {
    try {
      return {
        sucesso: true,
        email: new Email(valor)
      };
    } catch (error) {
      return {
        sucesso: false,
        erro: error instanceof Error ? error.message : 'Email inválido'
      };
    }
  }

  // Getters
  get valor(): string {
    return this._valor;
  }

  get dominio(): string {
    return this._valor.split('@')[1];
  }

  get usuario(): string {
    return this._valor.split('@')[0];
  }

  // Validações
  private ehValido(email: string): boolean {
    // Regex mais rigorosa para validação de email
    const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!regex.test(email)) {
      return false;
    }

    // Validações adicionais
    if (email.length > 254) {
      return false; // RFC 5321
    }

    if (email.split('@')[0].length > 64) {
      return false; // RFC 5321
    }

    // Verificar se não tem caracteres consecutivos inválidos
    if (email.includes('..') || email.startsWith('.') || email.endsWith('.')) {
      return false;
    }

    return true;
  }

  // Verificações de domínio
  isGmail(): boolean {
    return this.dominio === 'gmail.com';
  }

  isOutlook(): boolean {
    const dominiosOutlook = ['outlook.com', 'hotmail.com', 'live.com', 'msn.com'];
    return dominiosOutlook.includes(this.dominio);
  }

  isYahoo(): boolean {
    const dominiosYahoo = ['yahoo.com', 'yahoo.com.br'];
    return dominiosYahoo.includes(this.dominio);
  }

  isEmpresarial(): boolean {
    const dominiosPublicos = [
      'gmail.com', 'outlook.com', 'hotmail.com', 'live.com', 
      'yahoo.com', 'yahoo.com.br', 'bol.com.br', 'uol.com.br',
      'ig.com.br', 'terra.com.br'
    ];
    
    return !dominiosPublicos.includes(this.dominio);
  }

  // Formatação
  toString(): string {
    return this._valor;
  }

  formatado(): string {
    return this._valor;
  }

  mascardo(): string {
    const [usuario, dominio] = this._valor.split('@');
    if (usuario.length <= 2) {
      return `${usuario[0]}***@${dominio}`;
    }
    
    const inicio = usuario.slice(0, 2);
    const fim = usuario.slice(-1);
    return `${inicio}***${fim}@${dominio}`;
  }

  // Comparação
  equals(outro: Email): boolean {
    return this._valor === outro._valor;
  }

  // Serialização
  paraJSON(): { valor: string; dominio: string; usuario: string } {
    return {
      valor: this._valor,
      dominio: this.dominio,
      usuario: this.usuario
    };
  }

  // Validações de contexto
  validarParaRegistro(): { valido: boolean; motivos: string[] } {
    const motivos: string[] = [];

    // Verificar se é email descartável (lista básica)
    const dominiosDescartaveis = [
      '10minutemail.com', 'temp-mail.org', 'guerrillamail.com',
      'mailinator.com', 'throwaway.email'
    ];

    if (dominiosDescartaveis.includes(this.dominio)) {
      motivos.push('Email de domínio descartável não é permitido');
    }

    // Verificar se tem características suspeitas
    if (this.usuario.length < 3) {
      motivos.push('Nome de usuário muito curto');
    }

    if (/^\d+$/.test(this.usuario)) {
      motivos.push('Nome de usuário não pode ser apenas números');
    }

    return {
      valido: motivos.length === 0,
      motivos
    };
  }
}
