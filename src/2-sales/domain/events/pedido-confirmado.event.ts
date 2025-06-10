export class PedidoConfirmadoEvent {
  constructor(
    public readonly pedidoId: string,
    public readonly clienteId: string,
    public readonly valor: number,
    public readonly enderecoEntrega?: string,
    public readonly itens?: Array<{
      produtoId: string;
      nomeProduto: string;
      quantidade: number;
      preco: number;
    }>
  ) {}
}
