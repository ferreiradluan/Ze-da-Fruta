export class StatusPagamento {
  private static readonly VALORES_VALIDOS = [
    'PENDENTE', 'SUCESSO', 'FALHOU', 'REEMBOLSADO', 'PARCIALMENTE_REEMBOLSADO'
  ];

  public static readonly PENDENTE = new StatusPagamento('PENDENTE');
  public static readonly SUCESSO = new StatusPagamento('SUCESSO');
  public static readonly FALHOU = new StatusPagamento('FALHOU');
  public static readonly REEMBOLSADO = new StatusPagamento('REEMBOLSADO');
  public static readonly PARCIALMENTE_REEMBOLSADO = new StatusPagamento('PARCIALMENTE_REEMBOLSADO');

  private constructor(private readonly _valor: string) {
    // Não validar no constructor para evitar problemas de inicialização
    this._valor = _valor;
  }

  public static criar(valor: string): StatusPagamento {
    if (!StatusPagamento.VALORES_VALIDOS.includes(valor)) {
      throw new Error(`Status de pagamento inválido: ${valor}`);
    }
    return new StatusPagamento(valor);
  }

  public static obterTodos(): StatusPagamento[] {
    return [
      StatusPagamento.PENDENTE,
      StatusPagamento.SUCESSO,
      StatusPagamento.FALHOU,
      StatusPagamento.REEMBOLSADO,
      StatusPagamento.PARCIALMENTE_REEMBOLSADO
    ];
  }

  get valor(): string {
    return this._valor;
  }

  equals(outro: StatusPagamento): boolean {
    return this._valor === outro._valor;
  }

  toString(): string {
    return this._valor;
  }

  // Métodos de negócio (DDD)
  podeSerConfirmado(): boolean {
    return this.equals(StatusPagamento.PENDENTE);
  }

  podeSerReembolsado(): boolean {
    return this.equals(StatusPagamento.SUCESSO);
  }

  estaConcluido(): boolean {
    return this.equals(StatusPagamento.SUCESSO) || 
           this.equals(StatusPagamento.REEMBOLSADO) ||
           this.equals(StatusPagamento.PARCIALMENTE_REEMBOLSADO);
  }
}
