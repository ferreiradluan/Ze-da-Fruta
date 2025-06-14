import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Produto } from '../../domain/entities/produto.entity';
import { Pedido } from '../../domain/entities/pedido.entity';
import { Cupom } from '../../domain/entities/cupom.entity';
import { Categoria } from '../../domain/entities/categoria.entity';
import { Estabelecimento } from '../../domain/entities/estabelecimento.entity';
import { PedidoRepository } from '../../infrastructure/repositories/pedido.repository';
import { ProdutoRepository } from '../../infrastructure/repositories/produto.repository';
import { EstabelecimentoRepository } from '../../infrastructure/repositories/estabelecimento.repository';
import { CupomRepository } from '../../infrastructure/repositories/cupom.repository';
import { CategoriaRepository } from '../../infrastructure/repositories/categoria.repository';
import { StatusPedido } from '../../domain/enums/status-pedido.enum';

/**
 * SalesService - Seguindo estritamente o diagrama DDD
 * Contém os 5 métodos principais especificados no diagrama:
 * - criarPedido(clienteId, dadosSacola)
 * - obterPedido(pedidoId, clienteId)
 * - listarProdutosDeLoja(lojaId)
 * - obterDetalhesProduto(produtoId)
 * - aplicarCupomAoPedido(pedidoId, codigoCupom)
 * 
 * + Métodos migrados dos services extras para consolidação
 */
@Injectable()
export class SalesService {
  constructor(
    private readonly pedidoRepository: PedidoRepository,
    private readonly produtoRepository: ProdutoRepository,
    private readonly estabelecimentoRepository: EstabelecimentoRepository,
    private readonly cupomRepository: CupomRepository,
    private readonly categoriaRepository: CategoriaRepository,
  ) {}

  /**
   * Cria um novo pedido com base nos dados da sacola
   * Método principal do diagrama para orquestrar criação de pedidos
   */
  async criarPedido(clienteId: string, dadosSacola: any): Promise<Pedido> {
    // Criar pedido usando domínio rico
    const pedido = new Pedido();
    pedido.clienteId = clienteId;
    pedido.itens = [];

    let estabelecimentoId: string | null = null;

    // Adicionar itens da sacola usando métodos do domínio rico
    for (const itemSacola of dadosSacola.itens) {
      const produto = await this.produtoRepository.findById(itemSacola.produtoId);
      if (!produto) {
        throw new NotFoundException(`Produto ${itemSacola.produtoId} não encontrado`);
      }

      // Validar que todos os produtos são do mesmo estabelecimento
      if (estabelecimentoId === null) {
        estabelecimentoId = produto.estabelecimentoId;
      } else if (estabelecimentoId !== produto.estabelecimentoId) {
        throw new BadRequestException('Todos os produtos devem ser do mesmo estabelecimento');
      }
      
      // Usar método do domínio rico Pedido
      pedido.adicionarItem(produto, itemSacola.quantidade);
    }

    // Validar que há itens no pedido
    if (!estabelecimentoId) {
      throw new BadRequestException('Pedido deve conter pelo menos um item');
    }

    // Definir estabelecimento do pedido
    pedido.estabelecimentoId = estabelecimentoId;

    // Aplicar cupom se fornecido usando método do domínio rico
    if (dadosSacola.cupomCodigo) {
      const cupom = await this.cupomRepository.findByCodigo(dadosSacola.cupomCodigo);
      if (cupom) {
        // Usar método do domínio rico Pedido
        pedido.aplicarCupom(cupom);
      }
    }

    // Salvar usando repository
    return await this.pedidoRepository.save(pedido);
  }

  /**
   * Obtém um pedido específico do cliente
   * Método do diagrama para buscar pedidos com validação de acesso
   */
  async obterPedido(pedidoId: string, clienteId: string): Promise<Pedido> {
    const pedido = await this.pedidoRepository.findById(pedidoId);
    
    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado');
    }

    if (pedido.clienteId !== clienteId) {
      throw new ForbiddenException('Acesso negado ao pedido');
    }

    return pedido;
  }

  /**
   * Lista produtos de uma loja específica
   * Método do diagrama para catálogo por estabelecimento
   */
  async listarProdutosDeLoja(lojaId: string): Promise<Produto[]> {
    return await this.produtoRepository.findByEstabelecimento(lojaId);
  }

  /**
   * Obtém detalhes de um produto específico
   * Método do diagrama para visualização de produto individual
   */
  async obterDetalhesProduto(produtoId: string): Promise<Produto> {
    const produto = await this.produtoRepository.findById(produtoId);
    
    if (!produto) {
      throw new NotFoundException('Produto não encontrado');
    }

    return produto;
  }
  /**
   * Aplica cupom a um pedido
   * Método do diagrama para aplicar descontos usando domínio rico
   */
  async aplicarCupomAoPedido(pedidoId: string, codigoCupom: string): Promise<Pedido> {
    const pedido = await this.pedidoRepository.findById(pedidoId);
    
    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado');
    }

    if (!pedido.podeSerEditado()) {
      throw new BadRequestException('Pedido não pode ser editado');
    }

    const cupom = await this.cupomRepository.findByCodigo(codigoCupom);
    
    if (!cupom) {
      throw new NotFoundException('Cupom não encontrado');
    }

    // Usar método do domínio rico Pedido
    pedido.aplicarCupom(cupom);

    return await this.pedidoRepository.save(pedido);
  }

  // ===== MÉTODOS MIGRADOS DOS SERVICES EXTRAS =====
    // De CategoriaService:
  async listarCategoriasPublico(): Promise<Categoria[]> {
    return await this.categoriaRepository.findAll();
  }

  // De CupomService:
  async validarCupom(codigo: string, valorPedido: number): Promise<any> {
    const cupom = await this.cupomRepository.findByCodigo(codigo);
    if (!cupom || !cupom.ativo) {
      return { valido: false, motivo: 'Cupom inválido ou inativo' };
    }

    if (cupom.dataVencimento && cupom.dataVencimento < new Date()) {
      return { valido: false, motivo: 'Cupom expirado' };
    }
    
    const desconto = cupom.calcularDesconto(valorPedido);
    return {
      valido: true,
      motivo: 'Cupom válido',
      desconto: desconto,
      cupom: cupom,
      valorFinal: valorPedido - desconto
    };
  }

  // De LojaService:
  async listarEstabelecimentosPublico(): Promise<Estabelecimento[]> {
    return await this.estabelecimentoRepository.findPublic();
  }

  async obterDetalhesLoja(id: string): Promise<Estabelecimento> {
    const estabelecimento = await this.estabelecimentoRepository.findById(id);
    if (!estabelecimento) {
      throw new NotFoundException('Estabelecimento não encontrado');
    }
    return estabelecimento;
  }

  async buscarProdutosPublico(filtros: any): Promise<Produto[]> {
    return await this.produtoRepository.findWithFilters(filtros);
  }

  // De LojistaPedidoService:
  async listarPedidosPorEstabelecimento(estabelecimentoId: string, status?: StatusPedido): Promise<Pedido[]> {
    if (status) {
      return await this.pedidoRepository.findByEstabelecimentoAndStatus(estabelecimentoId, status);
    }
    return await this.pedidoRepository.findByEstabelecimento(estabelecimentoId);
  }
}
