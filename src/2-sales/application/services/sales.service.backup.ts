import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
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
import { STATUS_PEDIDO, StatusPedido } from '../../domain/types/status-pedido.types';

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
    private readonly eventEmitter: EventEmitter2,
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
      }      // Validar que todos os produtos são do mesmo estabelecimento
      if (estabelecimentoId === null) {
        estabelecimentoId = produto.estabelecimentoId || null;
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

  /**
   * Confirma um pedido e emite evento para criar entrega
   * Método para integração com o sistema de entregas via eventos
   */
  async confirmarPedido(pedidoId: string, enderecoEntrega: any): Promise<Pedido> {
    const pedido = await this.pedidoRepository.findById(pedidoId);
    
    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado');
    }

    // Atualizar status do pedido para confirmado/pago
    pedido.status = STATUS_PEDIDO.PAGO;
    const pedidoConfirmado = await this.pedidoRepository.save(pedido);

    // ✅ EMITIR EVENTO PARA CRIAR ENTREGA
    await this.eventEmitter.emitAsync('pedido.confirmado', {
      pedidoId: pedido.id,
      enderecoEntrega: enderecoEntrega,
      enderecoColeta: {
        rua: 'Rua do Estabelecimento', 
        numero: '123',
        cidade: 'São Paulo',
        cep: '01234-567'
      }
    });

    return pedidoConfirmado;
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
  /**
   * Cria cupom global (chamado pelo AdminService)
   */
  async criarCupomGlobal(dadosCupom: any): Promise<any> {
    try {
      // Criar cupom global usando domínio rico
      const cupom = new Cupom();
      cupom.codigo = dadosCupom.codigo || this.gerarCodigoCupom();
      cupom.descricao = dadosCupom.descricao || 'Cupom Global';
      cupom.tipoDesconto = dadosCupom.tipoDesconto || 'PERCENTUAL';
      cupom.valor = dadosCupom.valor || 10; // 10% ou R$ 10
      cupom.valorMinimoCompra = dadosCupom.valorMinimo || 0;
      cupom.valorMaximoDesconto = dadosCupom.valorMaximo || null;
      cupom.dataValidade = dadosCupom.dataValidade ? new Date(dadosCupom.dataValidade) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias
      cupom.ativo = true;
      cupom.limitesUso = dadosCupom.limitesUso || 1000; // Limite alto para cupom global
      cupom.vezesUsado = 0;
      // cupom.estabelecimentoId permanece undefined para cupons globais

      const cupomSalvo = await this.cupomRepository.save(cupom);

      return {
        id: cupomSalvo.id,
        codigo: cupomSalvo.codigo,
        descricao: cupomSalvo.descricao,
        tipoDesconto: cupomSalvo.tipoDesconto,
        valor: cupomSalvo.valor,
        valorMinimoCompra: cupomSalvo.valorMinimoCompra,
        valorMaximoDesconto: cupomSalvo.valorMaximoDesconto,
        dataValidade: cupomSalvo.dataValidade,
        isGlobal: true,
        message: 'Cupom global criado com sucesso'
      };
    } catch (error) {
      throw new BadRequestException('Erro ao criar cupom global: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  /**
   * Desativa cupom (chamado pelo AdminService)
   */
  async desativarCupom(cupomId: string): Promise<any> {
    try {
      const cupom = await this.cupomRepository.findById(cupomId);

      if (!cupom) {
        throw new NotFoundException('Cupom não encontrado');
      }

      // Usar método do domínio rico para desativar
      cupom.ativo = false;
      
      const cupomAtualizado = await this.cupomRepository.save(cupom);

      return {
        id: cupomAtualizado.id,
        codigo: cupomAtualizado.codigo,
        ativo: cupomAtualizado.ativo,
        message: 'Cupom desativado com sucesso'
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Erro ao desativar cupom: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  /**
   * Gera código único para cupom
   */
  private gerarCodigoCupom(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `GLOBAL_${timestamp}_${random}`.toUpperCase();
  }
}
