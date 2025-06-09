import { Pedido, StatusPedido } from '../entities/pedido.entity';
import { Produto } from '../entities/produto.entity';
import { ItemPedido } from '../entities/item-pedido.entity';
import { Dinheiro } from '../value-objects/dinheiro.vo';
import { 
  PedidoInvalidoError,
  PedidoNaoPodeSerEditadoError,
  ItemPedidoNaoEncontradoError,
  EstoqueInsuficienteError
} from '../errors/pedido.errors';
import { 
  ProdutoIndisponivelError,
  ProdutoInativoError,
  EstoqueInsuficienteError as ProdutoEstoqueError
} from '../errors/produto.errors';
import { DomainEventDispatcher } from '../../../common/domain/events/domain-event.base';

export interface EstoqueRepository {
  verificarDisponibilidade(produtoId: string, quantidade: number): Promise<boolean>;
  reservarEstoque(produtoId: string, quantidade: number): Promise<void>;
  liberarEstoque(produtoId: string, quantidade: number): Promise<void>;
  confirmarReserva(produtoId: string, quantidade: number): Promise<void>;
}

export interface CupomRepository {
  buscarPorCodigo(codigo: string): Promise<any | null>;
  validarCupom(cupom: any, valorPedido: number): Promise<boolean>;
}

/**
 * Serviço de domínio para operações complexas de pedidos
 * que envolvem múltiplas entidades e regras de negócio
 */
export class PedidoDomainService {
  constructor(
    private readonly eventDispatcher: DomainEventDispatcher,
    private readonly estoqueRepository: EstoqueRepository,
    private readonly cupomRepository: CupomRepository
  ) {}

  /**
   * Cria um pedido com validações completas de estoque e disponibilidade
   */
  async criarPedidoComValidacoes(
    dados: {
      clienteId: string;
      itens: Array<{
        produto: Produto;
        quantidade: number;
        observacoes?: string;
      }>;
      observacoes?: string;
      enderecoEntregaId?: string;
    }
  ): Promise<Pedido> {
    // Validar disponibilidade de todos os produtos
    await this.validarDisponibilidadeProdutos(dados.itens);

    // Criar pedido
    const pedido = Pedido.criar({
      clienteId: dados.clienteId,
      observacoes: dados.observacoes,
      enderecoEntregaId: dados.enderecoEntregaId
    });

    // Adicionar itens com reserva de estoque
    for (const item of dados.itens) {
      await this.adicionarItemComReserva(pedido, item.produto, item.quantidade, item.observacoes);
    }

    return pedido;
  }

  /**
   * Adiciona item ao pedido com reserva automática de estoque
   */
  async adicionarItemComReserva(
    pedido: Pedido,
    produto: Produto,
    quantidade: number,
    observacoes?: string
  ): Promise<void> {
    // Validar produto disponível
    if (!produto.estaDisponivel()) {
      throw new ProdutoIndisponivelError();
    }

    if (!produto.estaAtivo()) {
      throw new ProdutoInativoError();
    }

    // Verificar estoque
    const estoqueDisponivel = await this.estoqueRepository.verificarDisponibilidade(
      produto.id || '', 
      quantidade
    );

    if (!estoqueDisponivel) {
      throw new EstoqueInsuficienteError(
        `Estoque insuficiente para o produto ${produto.nome}. Disponível: ${produto.quantidadeEstoque}, Solicitado: ${quantidade}`
      );
    }

    // Reservar estoque
    await this.estoqueRepository.reservarEstoque(produto.id || '', quantidade);

    try {
      // Adicionar item ao pedido
      pedido.adicionarItem(produto, quantidade, observacoes);
    } catch (error) {
      // Em caso de erro, liberar estoque reservado
      await this.estoqueRepository.liberarEstoque(produto.id || '', quantidade);
      throw error;
    }
  }

  /**
   * Remove item do pedido e libera estoque
   */
  async removerItemComLiberacao(
    pedido: Pedido,
    produtoId: string
  ): Promise<void> {
    // Buscar item para obter quantidade antes de remover
    const item = pedido.itens.find(i => i.produtoId === produtoId);
    if (!item) {
      throw new ItemPedidoNaoEncontradoError();
    }

    const quantidade = item.quantidade;

    // Remover item do pedido
    pedido.removerItem(produtoId);

    // Liberar estoque
    await this.estoqueRepository.liberarEstoque(produtoId, quantidade);
  }

  /**
   * Atualiza quantidade de item com ajuste de estoque
   */
  async atualizarQuantidadeItem(
    pedido: Pedido,
    produtoId: string,
    novaQuantidade: number
  ): Promise<void> {
    const item = pedido.itens.find(i => i.produtoId === produtoId);
    if (!item) {
      throw new ItemPedidoNaoEncontradoError();
    }

    const quantidadeAtual = item.quantidade;
    const diferenca = novaQuantidade - quantidadeAtual;

    if (diferenca > 0) {
      // Aumentando quantidade - verificar e reservar estoque adicional
      const estoqueDisponivel = await this.estoqueRepository.verificarDisponibilidade(
        produtoId, 
        diferenca
      );

      if (!estoqueDisponivel) {
        throw new EstoqueInsuficienteError(
          `Estoque insuficiente para aumentar quantidade do produto`
        );
      }

      await this.estoqueRepository.reservarEstoque(produtoId, diferenca);
    } else if (diferenca < 0) {
      // Diminuindo quantidade - liberar estoque
      await this.estoqueRepository.liberarEstoque(produtoId, Math.abs(diferenca));
    }

    // Atualizar quantidade no pedido
    pedido.atualizarQuantidadeItem(produtoId, novaQuantidade);
  }

  /**
   * Aplica cupom de desconto com validações
   */
  async aplicarCupomDesconto(
    pedido: Pedido,
    codigoCupom: string
  ): Promise<void> {
    if (pedido.status !== StatusPedido.RASCUNHO) {
      throw new PedidoNaoPodeSerEditadoError();
    }

    // Buscar cupom
    const cupom = await this.cupomRepository.buscarPorCodigo(codigoCupom);
    if (!cupom) {
      throw new PedidoInvalidoError('Cupom não encontrado');
    }

    // Validar cupom
    const cupomValido = await this.cupomRepository.validarCupom(cupom, pedido.valorTotal.valor);
    if (!cupomValido) {
      throw new PedidoInvalidoError('Cupom inválido ou expirado');
    }

    // Aplicar cupom
    pedido.aplicarCupom(cupom.codigo, Dinheiro.criar(cupom.valorDesconto));
  }

  /**
   * Confirma pedido com todas as validações e reservas
   */
  async confirmarPedido(pedido: Pedido): Promise<void> {
    if (pedido.status !== StatusPedido.RASCUNHO) {
      throw new PedidoNaoPodeSerEditadoError();
    }

    if (pedido.itens.length === 0) {
      throw new PedidoInvalidoError('Pedido deve ter pelo menos um item');
    }

    // Validar estoque de todos os itens novamente
    for (const item of pedido.itens) {
      const estoqueDisponivel = await this.estoqueRepository.verificarDisponibilidade(
        item.produtoId,
        item.quantidade
      );

      if (!estoqueDisponivel) {
        throw new EstoqueInsuficienteError(
          `Estoque insuficiente para o produto ${item.produto?.nome || item.produtoId}`
        );
      }
    }

    // Confirmar todas as reservas de estoque
    for (const item of pedido.itens) {
      await this.estoqueRepository.confirmarReserva(item.produtoId, item.quantidade);
    }

    // Confirmar pedido
    pedido.confirmar();
  }

  /**
   * Cancela pedido e libera todo o estoque reservado
   */
  async cancelarPedido(pedido: Pedido, motivo?: string): Promise<void> {
    if (!pedido.podeCancelar()) {
      throw new PedidoNaoPodeSerEditadoError();
    }

    // Liberar estoque de todos os itens
    for (const item of pedido.itens) {
      await this.estoqueRepository.liberarEstoque(item.produtoId, item.quantidade);
    }

    // Cancelar pedido
    pedido.cancelar(motivo);
  }

  /**
   * Calcula frete baseado no endereço e itens do pedido
   */
  calcularFrete(
    pedido: Pedido,
    cep: string,
    tipoEntrega: 'NORMAL' | 'EXPRESSA' = 'NORMAL'
  ): Dinheiro {
    // Lógica simplificada de cálculo de frete
    let valorBase = 10; // R$ 10,00 base

    // Adicionar por peso/volume dos itens
    const pesoPedido = pedido.itens.reduce((total, item) => {
      return total + (item.quantidade * (item.produto?.peso || 0.5));
    }, 0);

    valorBase += Math.floor(pesoPedido) * 2; // R$ 2,00 por kg

    // Ajustar por tipo de entrega
    if (tipoEntrega === 'EXPRESSA') {
      valorBase *= 1.5;
    }

    // Ajustar por valor do pedido (frete grátis acima de R$ 100)
    if (pedido.valorTotal.valor >= 100) {
      valorBase = 0;
    }

    return Dinheiro.criar(valorBase);
  }

  /**
   * Valida se pedido pode ser editado
   */
  validarEdicaoPedido(pedido: Pedido): void {
    if (pedido.status !== StatusPedido.RASCUNHO) {
      throw new PedidoNaoPodeSerEditadoError();
    }

    // Outras validações específicas podem ser adicionadas aqui
  }

  /**
   * Processa pagamento e atualiza status do pedido
   */
  async processarPagamento(
    pedido: Pedido,
    dadosPagamento: {
      tipo: 'CARTAO' | 'PIX' | 'DINHEIRO';
      valor: number;
      parcelas?: number;
    }
  ): Promise<void> {
    if (pedido.status !== StatusPedido.CONFIRMADO) {
      throw new PedidoInvalidoError('Pedido deve estar confirmado para processar pagamento');
    }

    // Validar valor do pagamento
    if (dadosPagamento.valor < pedido.valorTotal.valor) {
      throw new PedidoInvalidoError('Valor do pagamento insuficiente');
    }

    // Simular processamento de pagamento
    const pagamentoAprovado = await this.simularProcessamentoPagamento(dadosPagamento);

    if (!pagamentoAprovado) {
      throw new PedidoInvalidoError('Pagamento não aprovado');
    }

    // Marcar como pago
    pedido.marcarComoPago();
  }

  private async simularProcessamentoPagamento(
    dadosPagamento: any
  ): Promise<boolean> {
    // Simular delay de processamento
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simular aprovação (90% de chance)
    return Math.random() > 0.1;
  }

  private async validarDisponibilidadeProdutos(
    itens: Array<{ produto: Produto; quantidade: number }>
  ): Promise<void> {
    for (const item of itens) {
      if (!item.produto.estaDisponivel()) {
        throw new ProdutoIndisponivelError();
      }

      if (!item.produto.estaAtivo()) {
        throw new ProdutoInativoError();
      }

      const estoqueDisponivel = await this.estoqueRepository.verificarDisponibilidade(
        item.produto.id || '',
        item.quantidade
      );

      if (!estoqueDisponivel) {
        throw new EstoqueInsuficienteError(
          `Estoque insuficiente para ${item.produto.nome}`
        );
      }
    }
  }
}
