import { Injectable } from '@nestjs/common';

@Injectable()
export class SalesService {
  getLoja(id: number) {
    return { id, nome: 'Loja Exemplo' };
  }
  getProdutosDaLoja(id: number) {
    return [{ id: 1, nome: 'Produto 1' }];
  }
  getProduto(id: number) {
    return { id, nome: 'Produto Exemplo' };
  }
  getCategorias() {
    return [{ id: 1, nome: 'Categoria 1' }];
  }
  getPedidosMe() {
    return [{ id: 1, status: 'finalizado' }];
  }
  criarPedido(pedidoDto: any) {
    return { ...pedidoDto, id: 1 };
  }
  pedirNovamente(id: number) {
    return { id, status: 'novo' };
  }
  avaliarPedido(id: number, avaliacao: any) {
    return { id, ...avaliacao };
  }
  getSacola() {
    return { itens: [] };
  }
  adicionarItemSacola(itemDto: any) {
    return { ...itemDto, adicionado: true };
  }
  getPedidosByUserId(userId: number) {
    return [{ id: 1, userId, status: 'finalizado' }];
  }
}
