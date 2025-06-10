import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, FindManyOptions } from 'typeorm';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { Produto } from '../../domain/entities/produto.entity';
import { Categoria } from '../../domain/entities/categoria.entity';
import { Estabelecimento } from '../../domain/entities/estabelecimento.entity';
import { Pedido } from '../../domain/entities/pedido.entity';
import { ItemPedido } from '../../domain/entities/item-pedido.entity';
import { Cupom } from '../../domain/entities/cupom.entity';
import { CreateProdutoDto } from '../../api/dto/create-produto.dto';
import { UpdateProdutoDto } from '../../api/dto/update-produto.dto';
import { ListarProdutosDto } from '../../api/dto/listar-produtos.dto';
import { CreateCategoriaDto } from '../../api/dto/create-categoria.dto';
import { CreatePedidoDto } from '../../api/dto/create-pedido.dto';
import { UpdatePedidoDto, AdicionarItemDto, AplicarCupomDto } from '../../api/dto/update-pedido.dto';
import { CreateCupomDto, UpdateCupomDto } from '../../api/dto/create-cupom.dto';
import { StatusPedido } from '../../domain/enums/status-pedido.enum';
import { PaymentService } from '../../../4-payment/application/services/payment.service';
import { EventBusService, PagamentoProcessadoEvent } from '../../../common/event-bus';
import { PedidoConfirmadoEvent } from '../../domain/events';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Produto)
    private readonly produtoRepository: Repository<Produto>,
    @InjectRepository(Categoria)
    private readonly categoriaRepository: Repository<Categoria>,
    @InjectRepository(Estabelecimento)
    private readonly estabelecimentoRepository: Repository<Estabelecimento>,
    @InjectRepository(Pedido)
    private readonly pedidoRepository: Repository<Pedido>,
    @InjectRepository(ItemPedido)
    private readonly itemPedidoRepository: Repository<ItemPedido>,
    @InjectRepository(Cupom)
    private readonly cupomRepository: Repository<Cupom>,
    private readonly paymentService: PaymentService,
    private readonly eventBusService: EventBusService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ===== CATÁLOGO PÚBLICO (sem autenticação) =====

  async buscarProdutosPublico(filtros: ListarProdutosDto) {
    const {
      search,
      categoria,
      estabelecimento,
      precoMin,
      precoMax,
      ordenacao = 'created_desc',
      page = 1,
      limit = 20
    } = filtros;    const queryBuilder = this.produtoRepository
      .createQueryBuilder('produto')
      .leftJoinAndSelect('produto.categorias', 'categoria')
      .leftJoinAndSelect('produto.estabelecimento', 'estabelecimento')
      .where('produto.ativo = :ativo', { ativo: true });

    // Filtros
    if (search) {
      queryBuilder.andWhere(
        '(produto.nome LIKE :search OR produto.descricao LIKE :search)',
        { search: `%${search}%` }
      );
    }    if (categoria) {
      // Check if it's a UUID (ID) or a name
      if (categoria.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        queryBuilder.andWhere('categoria.id = :categoriaId', { categoriaId: categoria });
      } else {
        queryBuilder.andWhere('categoria.nome = :categoriaNome', { categoriaNome: categoria });
      }
    }

    if (estabelecimento) {
      // Check if it's a UUID (ID) or a name
      if (estabelecimento.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        queryBuilder.andWhere('estabelecimento.id = :estabelecimentoId', { estabelecimentoId: estabelecimento });
      } else {
        queryBuilder.andWhere('estabelecimento.nome = :estabelecimentoNome', { estabelecimentoNome: estabelecimento });
      }
    }

    if (precoMin !== undefined) {
      queryBuilder.andWhere('produto.preco >= :precoMin', { precoMin });
    }

    if (precoMax !== undefined) {
      queryBuilder.andWhere('produto.preco <= :precoMax', { precoMax });
    }

    // Ordenação
    switch (ordenacao) {
      case 'preco_asc':
        queryBuilder.orderBy('produto.preco', 'ASC');
        break;
      case 'preco_desc':
        queryBuilder.orderBy('produto.preco', 'DESC');
        break;
      case 'nome_asc':
        queryBuilder.orderBy('produto.nome', 'ASC');
        break;
      case 'nome_desc':
        queryBuilder.orderBy('produto.nome', 'DESC');
        break;
      case 'created_asc':
        queryBuilder.orderBy('produto.createdAt', 'ASC');
        break;
      default:
        queryBuilder.orderBy('produto.createdAt', 'DESC');
    }

    // Paginação
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [produtos, total] = await queryBuilder.getManyAndCount();

    return {
      produtos,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async buscarProdutoPorId(id: string): Promise<Produto> {
    const produto = await this.produtoRepository.findOne({
      where: { id, ativo: true },
      relations: ['categoria', 'estabelecimento']
    });

    if (!produto) {
      throw new NotFoundException('Produto não encontrado');
    }

    return produto;
  }

  async listarCategoriasPublico(): Promise<Categoria[]> {
    return this.categoriaRepository.find({
      where: { ativo: true },
      order: { nome: 'ASC' }
    });
  }
  async listarEstabelecimentosPublico(): Promise<Estabelecimento[]> {
    return this.estabelecimentoRepository.find({
      where: { ativo: true },
      order: { nome: 'ASC' }
    });
  }

  // ===== MÉTODOS ESPECÍFICOS DE LOJAS (Fase 3) =====

  /**
   * Lista todas as lojas ativas
   * Método público - não requer autenticação
   */
  async listarLojas(): Promise<Estabelecimento[]> {
    return this.estabelecimentoRepository.find({
      where: { ativo: true },
      order: { nome: 'ASC' }
    });
  }

  /**
   * Obtém detalhes de uma loja específica por ID
   * Método público - não requer autenticação
   * @param lojaId - ID da loja
   * @throws NotFoundException se a loja não for encontrada
   */
  async obterDetalhesLoja(lojaId: string): Promise<Estabelecimento> {
    const loja = await this.estabelecimentoRepository.findOne({
      where: { id: lojaId, ativo: true }
    });

    if (!loja) {
      throw new NotFoundException('Loja não encontrada');
    }

    return loja;
  }

  /**
   * Lista todos os produtos de uma loja específica
   * Método público - não requer autenticação
   * @param lojaId - ID da loja
   * @throws NotFoundException se a loja não for encontrada
   */
  async listarProdutosDeLoja(lojaId: string): Promise<Produto[]> {
    // Primeiro verifica se a loja existe (reutilizando o método obterDetalhesLoja)
    await this.obterDetalhesLoja(lojaId);

    // Se chegou até aqui, a loja existe, então busca os produtos
    return this.produtoRepository.find({
      where: { 
        estabelecimento: { id: lojaId },
        ativo: true,
        disponivel: true
      },
      relations: ['categorias', 'estabelecimento'],
      order: { nome: 'ASC' }
    });
  }

  // ===== GESTÃO DE PRODUTOS (requer autenticação) =====

  async listarProdutosPorPerfil(user: any, filtros?: ListarProdutosDto): Promise<any> {
    if (!user || !user.roles || user.roles.length === 0) {
      throw new ForbiddenException('Usuário sem perfil válido');
    }

    let queryBuilder = this.produtoRepository
      .createQueryBuilder('produto')
      .leftJoinAndSelect('produto.categoria', 'categoria')
      .leftJoinAndSelect('produto.estabelecimento', 'estabelecimento');

    // Admin vê todos os produtos
    if (user.roles.includes('ADMIN')) {
      // Não adiciona filtros de usuário
    }
    // Partner vê apenas seus produtos
    else if (user.roles.includes('PARTNER')) {
      queryBuilder.where('produto.partnerId = :partnerId', { partnerId: user.id });
    }
    else {
      throw new ForbiddenException('Acesso não autorizado para listar produtos');
    }

    // Aplicar filtros se fornecidos
    if (filtros) {
      if (filtros.search) {
        queryBuilder.andWhere(
          '(produto.nome LIKE :search OR produto.descricao LIKE :search)',
          { search: `%${filtros.search}%` }
        );
      }

      if (filtros.categoria) {
        queryBuilder.andWhere('categoria.id = :categoriaId', { categoriaId: filtros.categoria });
      }
    }

    queryBuilder.orderBy('produto.createdAt', 'DESC');

    return queryBuilder.getMany();
  }

  async criarProduto(user: any, createProdutoDto: CreateProdutoDto): Promise<Produto> {
    if (!user.roles.includes('ADMIN') && !user.roles.includes('PARTNER')) {
      throw new ForbiddenException('Apenas admins e parceiros podem criar produtos');
    }

    const produto = this.produtoRepository.create({
      ...createProdutoDto,
      partnerId: user.roles.includes('PARTNER') ? user.id : createProdutoDto.partnerId || null
    });

    // Validar categoria se fornecida
    if (createProdutoDto.categoriaId) {
      const categoria = await this.categoriaRepository.findOne({ 
        where: { id: createProdutoDto.categoriaId } 
      });
      if (!categoria) {
        throw new BadRequestException('Categoria não encontrada');
      }
    }

    // Validar estabelecimento se fornecido
    if (createProdutoDto.estabelecimentoId) {
      const estabelecimento = await this.estabelecimentoRepository.findOne({ 
        where: { id: createProdutoDto.estabelecimentoId } 
      });
      if (!estabelecimento) {
        throw new BadRequestException('Estabelecimento não encontrado');
      }
    }

    return this.produtoRepository.save(produto);
  }

  async atualizarProduto(user: any, id: string, updateProdutoDto: UpdateProdutoDto): Promise<Produto> {
    const produto = await this.produtoRepository.findOne({ where: { id } });
    
    if (!produto) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Verificar permissões
    if (!user.roles.includes('ADMIN') && produto.partnerId !== user.id) {
      throw new ForbiddenException('Você só pode editar seus próprios produtos');
    }

    // Validar categoria se fornecida
    if (updateProdutoDto.categoriaId) {
      const categoria = await this.categoriaRepository.findOne({ 
        where: { id: updateProdutoDto.categoriaId } 
      });
      if (!categoria) {
        throw new BadRequestException('Categoria não encontrada');
      }
    }

    Object.assign(produto, updateProdutoDto);
    return this.produtoRepository.save(produto);
  }

  async excluirProduto(user: any, id: string): Promise<void> {
    const produto = await this.produtoRepository.findOne({ where: { id } });
    
    if (!produto) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Verificar permissões
    if (!user.roles.includes('ADMIN') && produto.partnerId !== user.id) {
      throw new ForbiddenException('Você só pode excluir seus próprios produtos');
    }

    await this.produtoRepository.remove(produto);
  }

  // ===== GESTÃO DE CATEGORIAS =====

  async listarCategorias(): Promise<Categoria[]> {
    return this.categoriaRepository.find({ order: { nome: 'ASC' } });
  }

  async criarCategoria(user: any, createCategoriaDto: CreateCategoriaDto): Promise<Categoria> {
    if (!user.roles.includes('ADMIN')) {
      throw new ForbiddenException('Apenas admins podem criar categorias');
    }

    const categoria = this.categoriaRepository.create(createCategoriaDto);
    return this.categoriaRepository.save(categoria);
  }

  async atualizarCategoria(user: any, id: string, updateData: Partial<CreateCategoriaDto>): Promise<Categoria> {
    if (!user.roles.includes('ADMIN')) {
      throw new ForbiddenException('Apenas admins podem atualizar categorias');
    }

    const categoria = await this.categoriaRepository.findOne({ where: { id } });
    if (!categoria) {
      throw new NotFoundException('Categoria não encontrada');
    }

    Object.assign(categoria, updateData);
    return this.categoriaRepository.save(categoria);
  }
  async excluirCategoria(user: any, id: string): Promise<void> {
    if (!user.roles.includes('ADMIN')) {
      throw new ForbiddenException('Apenas admins podem excluir categorias');
    }

    const categoria = await this.categoriaRepository.findOne({ where: { id } });
    if (!categoria) {
      throw new NotFoundException('Categoria não encontrada');
    }

    await this.categoriaRepository.remove(categoria);
  }

  // ===== MÉTODOS PARA GERENCIAMENTO DE IMAGENS =====

  async updateProductImage(user: any, productId: string, imageUrl: string): Promise<void> {
    // Verifica se o usuário tem permissão (admin ou proprietário do estabelecimento)
    const produto = await this.produtoRepository.findOne({
      where: { id: productId },
      relations: ['estabelecimento']
    });

    if (!produto) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Admin pode alterar qualquer imagem
    // Parceiro só pode alterar produtos do seu estabelecimento
    if (!user.roles.includes('ADMIN')) {
      if (!user.roles.includes('PARCEIRO') || produto.estabelecimento?.id !== user.estabelecimentoId) {
        throw new ForbiddenException('Você não tem permissão para alterar a imagem deste produto');
      }
    }

    produto.imagemUrl = imageUrl;
    await this.produtoRepository.save(produto);
  }

  async updateEstablishmentImage(user: any, establishmentId: string, imageUrl: string): Promise<void> {
    const estabelecimento = await this.estabelecimentoRepository.findOne({
      where: { id: establishmentId }
    });

    if (!estabelecimento) {
      throw new NotFoundException('Estabelecimento não encontrado');
    }

    // Admin pode alterar qualquer imagem
    // Parceiro só pode alterar seu próprio estabelecimento
    if (!user.roles.includes('ADMIN')) {
      if (!user.roles.includes('PARCEIRO') || establishmentId !== user.estabelecimentoId) {
        throw new ForbiddenException('Você não tem permissão para alterar a imagem deste estabelecimento');
      }
    }

    // Assumindo que existe um campo imagemUrl na entidade Estabelecimento
    estabelecimento.imagemUrl = imageUrl;
    await this.estabelecimentoRepository.save(estabelecimento);
  }
  // ===== GESTÃO DE PEDIDOS =====
  /**
   * Cria um novo pedido
   * @param usuarioId - ID do usuário que está fazendo o pedido
   * @param createPedidoDto - Dados do pedido
   * @returns URL da sessão de checkout
   */
  async criarPedido(usuarioId: string, createPedidoDto: CreatePedidoDto): Promise<{ checkoutUrl: string }> {
    // Criar pedido
    const pedido = new Pedido();
    pedido.clienteId = usuarioId;
    if (createPedidoDto.observacoes) {
      pedido.observacoes = createPedidoDto.observacoes;
    }
    if (createPedidoDto.enderecoEntrega) {
      pedido.enderecoEntrega = createPedidoDto.enderecoEntrega;
    }
    pedido.status = StatusPedido.PAGAMENTO_PENDENTE;

    // Salvar pedido primeiro para obter o ID
    const pedidoSalvo = await this.pedidoRepository.save(pedido);

    // Processar itens do pedido
    for (const itemDto of createPedidoDto.itens) {
      // Buscar produto
      const produto = await this.produtoRepository.findOne({
        where: { id: itemDto.produtoId, ativo: true, disponivel: true }
      });

      if (!produto) {
        throw new NotFoundException(`Produto ${itemDto.produtoId} não encontrado ou indisponível`);
      }

      // Verificar estoque suficiente
      if (!produto.temEstoqueSuficiente(itemDto.quantidade)) {
        throw new BadRequestException(`Estoque insuficiente para o produto ${produto.nome}. Disponível: ${produto.estoque}, solicitado: ${itemDto.quantidade}`);
      }

      // Adicionar item ao pedido usando método da entidade
      pedidoSalvo.adicionarItem(produto, itemDto.quantidade);
    }

    // Aplicar cupom se fornecido
    if (createPedidoDto.cupomCodigo) {
      const cupom = await this.cupomRepository.findOne({
        where: { codigo: createPedidoDto.cupomCodigo }
      });

      if (cupom && cupom.podeSerAplicado(pedidoSalvo.valorSubtotal)) {
        pedidoSalvo.aplicarCupom(cupom);
      }
    }    // Salvar pedido com itens e total calculado
    await this.pedidoRepository.save(pedidoSalvo);

    // Buscar pedido completo com relacionamentos para criar a sessão de pagamento
    const pedidoCompleto = await this.buscarPedidoPorId(pedidoSalvo.id);

    // Emitir evento de pedido criado
    await this.eventBusService.emitPedidoCriado({
      payload: {
        pedidoId: pedidoCompleto.id,
        usuarioId: pedidoCompleto.clienteId,
        valor: pedidoCompleto.valorTotal,
        itens: pedidoCompleto.itens.map(item => ({
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          preco: item.precoUnitario
        }))
      },
      aggregateId: pedidoCompleto.id
    });

    // Criar sessão de checkout no Stripe
    const checkoutUrl = await this.paymentService.criarSessaoCheckoutStripe(pedidoCompleto);

    return { checkoutUrl };
  }
  /**
   * Lista pedidos do usuário ou todos (para admin)
   */
  async listarPedidos(user: any, status?: StatusPedido): Promise<Pedido[]> {
    const queryBuilder = this.pedidoRepository
      .createQueryBuilder('pedido')
      .leftJoinAndSelect('pedido.itens', 'itens')
      .leftJoinAndSelect('itens.produto', 'produto')
      .leftJoinAndSelect('pedido.cupom', 'cupom');

    // Filtrar por usuário se não for admin
    if (!user.roles.includes('ADMIN')) {
      queryBuilder.andWhere('pedido.clienteId = :clienteId', { clienteId: user.id });
    }

    // Filtrar por status se fornecido
    if (status) {
      queryBuilder.andWhere('pedido.status = :status', { status });
    }

    queryBuilder.orderBy('pedido.createdAt', 'DESC');

    return queryBuilder.getMany();
  }

  /**
   * Busca um pedido específico por ID
   */
  async buscarPedidoPorId(pedidoId: string, usuarioId?: string): Promise<Pedido> {
    const queryBuilder = this.pedidoRepository
      .createQueryBuilder('pedido')
      .leftJoinAndSelect('pedido.itens', 'itens')
      .leftJoinAndSelect('itens.produto', 'produto')
      .leftJoinAndSelect('pedido.cupom', 'cupom')
      .where('pedido.id = :pedidoId', { pedidoId });

    // Se usuarioId for fornecido, filtrar por usuário
    if (usuarioId) {
      queryBuilder.andWhere('pedido.clienteId = :clienteId', { clienteId: usuarioId });
    }

    const pedido = await queryBuilder.getOne();

    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado');
    }

    return pedido;
  }
  /**
   * Atualiza um pedido
   */
  async atualizarPedido(pedido: Pedido): Promise<Pedido> {
    try {
      return await this.pedidoRepository.save(pedido);
    } catch (err) {
      console.error('Erro ao atualizar pedido', err);
      throw new Error('Erro ao atualizar pedido: ' + (err?.message || err));
    }
  }

  /**
   * Valida se um pedido pode ser reembolsado
   */
  validarReembolsoPedido(pedido: Pedido): { podeReembolsar: boolean; motivo?: string } {
    // Só pode reembolsar pedidos que foram pagos ou entregues
    const statusPermitidos = [StatusPedido.PAGO, StatusPedido.EM_PREPARO, StatusPedido.ENVIADO, StatusPedido.ENTREGUE];
    
    if (!statusPermitidos.includes(pedido.status as StatusPedido)) {
      return {
        podeReembolsar: false,
        motivo: `Pedido com status ${pedido.status} não pode ser reembolsado`
      };
    }

    // Verificar se já não foi reembolsado
    if (pedido.status === StatusPedido.REEMBOLSADO || pedido.status === StatusPedido.REEMBOLSO_SOLICITADO) {
      return {
        podeReembolsar: false,
        motivo: 'Pedido já foi reembolsado ou possui reembolso em andamento'
      };
    }

    return { podeReembolsar: true };
  }

  /**
   * Atualiza status do pedido
   */
  async atualizarStatusPedido(user: any, pedidoId: string, novoStatus: StatusPedido): Promise<Pedido> {
    const pedido = await this.buscarPedidoPorId(pedidoId);

    // Verificar permissões
    if (!user.roles.includes('ADMIN') && pedido.clienteId !== user.id) {
      throw new ForbiddenException('Você só pode atualizar seus próprios pedidos');
    }

    // Atualizar status diretamente (a validação de transição pode ser feita aqui)
    pedido.status = novoStatus;

    await this.pedidoRepository.save(pedido);

    return this.buscarPedidoPorId(pedidoId);
  }

  /**
   * Adiciona item ao pedido
   */
  async adicionarItemAoPedido(pedidoId: string, itemData: { produtoId: string; quantidade: number }): Promise<ItemPedido> {
    const pedido = await this.buscarPedidoPorId(pedidoId);

    // Verificar se pedido pode ser modificado
    if (!pedido.podeSerEditado()) {
      throw new BadRequestException('Pedido não pode ser modificado no status atual');
    }

    // Buscar produto
    const produto = await this.produtoRepository.findOne({
      where: { id: itemData.produtoId, ativo: true, disponivel: true }
    });

    if (!produto) {
      throw new NotFoundException('Produto não encontrado ou indisponível');
    }

    // Usar método da entidade para adicionar item
    pedido.adicionarItem(produto, itemData.quantidade);

    await this.pedidoRepository.save(pedido);

    // Retornar o item criado
    const itemCriado = pedido.itens.find(item => item.produtoId === produto.id);
    return itemCriado!;
  }

  /**
   * Remove item do pedido
   */
  async removerItemDoPedido(pedidoId: string, itemId: string, usuarioId?: string): Promise<void> {
    const pedido = await this.buscarPedidoPorId(pedidoId, usuarioId);

    // Verificar se pedido pode ser modificado
    if (!pedido.podeSerEditado()) {
      throw new BadRequestException('Pedido não pode ser modificado no status atual');
    }

    // Usar método da entidade para remover item
    pedido.removerItem(itemId);

    await this.pedidoRepository.save(pedido);
  }

  /**
   * Atualiza quantidade de um item no pedido
   */
  async atualizarQuantidadeItem(pedidoId: string, itemId: string, novaQuantidade: number, usuarioId?: string): Promise<ItemPedido> {
    const pedido = await this.buscarPedidoPorId(pedidoId, usuarioId);

    // Verificar se pedido pode ser modificado
    if (!pedido.podeSerEditado()) {
      throw new BadRequestException('Pedido não pode ser modificado no status atual');
    }

    // Usar método da entidade para atualizar quantidade
    pedido.atualizarQuantidadeItem(itemId, novaQuantidade);

    await this.pedidoRepository.save(pedido);

    // Retornar o item atualizado
    const itemAtualizado = pedido.itens.find(item => item.id === itemId);
    if (!itemAtualizado) {
      throw new NotFoundException('Item não encontrado');
    }

    return itemAtualizado;
  }

  /**
   * Aplica cupom ao pedido
   */
  async aplicarCupom(pedidoId: string, codigoCupom: string, usuarioId?: string): Promise<Pedido> {
    const pedido = await this.buscarPedidoPorId(pedidoId, usuarioId);

    // Verificar se pedido pode ser modificado
    if (!pedido.podeSerEditado()) {
      throw new BadRequestException('Pedido não pode ser modificado no status atual');
    }

    // Buscar cupom
    const cupom = await this.cupomRepository.findOne({
      where: { codigo: codigoCupom }
    });

    if (!cupom) {
      throw new NotFoundException('Cupom não encontrado');
    }

    // Usar método da entidade para aplicar cupom
    pedido.aplicarCupom(cupom);

    await this.pedidoRepository.save(pedido);

    return this.buscarPedidoPorId(pedidoId, usuarioId);
  }

  /**
   * Remove cupom do pedido
   */
  async removerCupom(pedidoId: string, usuarioId?: string): Promise<Pedido> {
    const pedido = await this.buscarPedidoPorId(pedidoId, usuarioId);

    // Verificar se pedido pode ser modificado
    if (!pedido.podeSerEditado()) {
      throw new BadRequestException('Pedido não pode ser modificado no status atual');
    }

    // Usar método da entidade para remover cupom
    pedido.removerCupom();

    await this.pedidoRepository.save(pedido);

    return this.buscarPedidoPorId(pedidoId, usuarioId);
  }  /**
   * Cancela pedido
   */
  async cancelarPedido(pedidoId: string, usuarioId?: string): Promise<Pedido> {
    const pedido = await this.buscarPedidoPorId(pedidoId, usuarioId);

    // Usar método da entidade para cancelar
    pedido.cancelar();

    await this.pedidoRepository.save(pedido);

    // Emitir evento de pedido cancelado
    await this.eventBusService.emitPedidoCancelado({
      payload: {
        pedidoId: pedido.id,
        motivo: 'Cancelado pelo usuário'
      },
      aggregateId: pedido.id
    });

    return pedido;
  }
  // ===== GESTÃO DE CUPONS =====
  /**
   * Cria um novo cupom (apenas admin)
   */
  async criarCupom(user: any, createCupomDto: CreateCupomDto): Promise<Cupom> {
    if (!user.roles.includes('ADMIN')) {
      throw new ForbiddenException('Apenas administradores podem criar cupons');
    }

    // Verificar se código já existe
    const cupomExistente = await this.cupomRepository.findOne({
      where: { codigo: createCupomDto.codigo }
    });

    if (cupomExistente) {
      throw new BadRequestException('Já existe um cupom com este código');
    }

    const cupom = this.cupomRepository.create(createCupomDto);
    return this.cupomRepository.save(cupom);
  }

  /**
   * Lista todos os cupons (admin) ou cupons válidos (usuários)
   */
  async listarCupons(user?: any): Promise<Cupom[]> {
    if (user?.roles.includes('ADMIN')) {
      // Admin vê todos os cupons
      return this.cupomRepository.find({
        order: { createdAt: 'DESC' }
      });
    } else {
      // Usuários veem apenas cupons válidos
      const agora = new Date();
      return this.cupomRepository.find({
        where: {
          ativo: true,
          dataValidade: Between(agora, new Date('2100-01-01'))
        },
        order: { createdAt: 'DESC' }
      });
    }
  }

  /**
   * Busca cupom por código
   */
  async buscarCupomPorCodigo(codigo: string): Promise<Cupom> {
    const cupom = await this.cupomRepository.findOne({
      where: { codigo }
    });

    if (!cupom) {
      throw new NotFoundException('Cupom não encontrado');
    }

    return cupom;
  }

  /**
   * Atualiza cupom (apenas admin)
   */
  async atualizarCupom(user: any, cupomId: string, updateData: UpdateCupomDto): Promise<Cupom> {
    if (!user.roles.includes('ADMIN')) {
      throw new ForbiddenException('Apenas administradores podem atualizar cupons');
    }

    const cupom = await this.cupomRepository.findOne({
      where: { id: cupomId }
    });

    if (!cupom) {
      throw new NotFoundException('Cupom não encontrado');
    }

    Object.assign(cupom, updateData);
    return this.cupomRepository.save(cupom);
  }

  /**
   * Desativa cupom (apenas admin)
   */
  async desativarCupom(user: any, cupomId: string): Promise<Cupom> {
    if (!user.roles.includes('ADMIN')) {
      throw new ForbiddenException('Apenas administradores podem desativar cupons');
    }

    const cupom = await this.cupomRepository.findOne({
      where: { id: cupomId }
    });

    if (!cupom) {
      throw new NotFoundException('Cupom não encontrado');
    }

    cupom.ativo = false;
    return this.cupomRepository.save(cupom);
  }

  /**
   * Valida se um cupom pode ser aplicado a um pedido
   */
  async validarCupom(codigo: string, valorPedido: number): Promise<{ valido: boolean; motivo?: string; cupom?: Cupom }> {
    try {
      const cupom = await this.buscarCupomPorCodigo(codigo);

      if (!cupom.estaValido()) {
        return { valido: false, motivo: 'Cupom inválido ou expirado' };
      }

      if (!cupom.podeSerAplicado(valorPedido)) {
        return { valido: false, motivo: `Valor mínimo do pedido deve ser R$ ${cupom.valorMinimoCompra?.toFixed(2) || '0,00'}` };
      }

      return { valido: true, cupom };
    } catch (error) {      return { valido: false, motivo: 'Cupom não encontrado' };
    }
  }

  // ===== EVENT HANDLERS REAIS =====
  
  /**
   * Handler REAL: Atualiza status do pedido quando pagamento é processado
   */
  @OnEvent('pagamento.processado')
  async handlePagamentoProcessado(event: PagamentoProcessadoEvent): Promise<void> {
    try {
      console.log('💳 Processando evento de pagamento:', {
        pedidoId: event.payload.pedidoId,
        status: event.payload.status,
        valor: event.payload.valor
      });      const pedido = await this.pedidoRepository.findOne({
        where: { id: event.payload.pedidoId },
        relations: ['itens', 'itens.produto']
      });

      if (!pedido) {
        console.error(`Pedido ${event.payload.pedidoId} não encontrado para atualização de pagamento`);
        return;
      }

      // Atualizar status baseado no resultado do pagamento
      switch (event.payload.status) {
        case 'aprovado':
          await this.confirmarPedidoPagamento(pedido);
          break;
        case 'recusado':
          await this.rejeitarPedidoPagamento(pedido);
          break;
        case 'estornado':
          await this.estornarPedido(pedido);
          break;
        default:
          console.warn(`Status de pagamento desconhecido: ${event.payload.status}`);
      }

    } catch (error) {
      console.error('Erro ao processar evento de pagamento:', error);
    }
  }  /**
   * Confirma pedido após pagamento aprovado
   */
  private async confirmarPedidoPagamento(pedido: Pedido): Promise<void> {
    // Atualizar status do pedido para PAGO
    pedido.status = StatusPedido.PAGO;
    await this.pedidoRepository.save(pedido);
    
    console.log(`✅ Pedido ${pedido.id} confirmado após pagamento aprovado`);
    
    // Reservar estoque dos produtos
    await this.reservarEstoquePedido(pedido);
    
    // Criar e publicar evento de pedido confirmado
    const pedidoConfirmadoEvent = new PedidoConfirmadoEvent(
      pedido.id,
      pedido.clienteId,
      pedido.valorTotal,
      pedido.enderecoEntrega,
      pedido.itens.map(item => ({
        produtoId: item.produtoId,
        nomeProduto: item.nomeProduto,
        quantidade: item.quantidade,
        preco: item.precoUnitario
      }))
    );
    
    // Publicar evento usando EventEmitter2
    this.eventEmitter.emit('pedido.confirmado', pedidoConfirmadoEvent);
    
    console.log(`📢 Evento 'pedido.confirmado' publicado para pedido ${pedido.id}`);
  }
  /**
   * Rejeita pedido após pagamento recusado
   */
  private async rejeitarPedidoPagamento(pedido: Pedido): Promise<void> {
    pedido.status = StatusPedido.CANCELADO;
    await this.pedidoRepository.save(pedido);
    
    console.log(`❌ Pedido ${pedido.id} cancelado após pagamento recusado`);
  }

  /**
   * Processa estorno do pedido
   */
  private async estornarPedido(pedido: Pedido): Promise<void> {
    // Se o pedido estava pago, liberar o estoque
    if (pedido.status === StatusPedido.PAGO) {
      await this.liberarEstoquePedido(pedido);
    }
    
    pedido.status = StatusPedido.CANCELADO;
    await this.pedidoRepository.save(pedido);
    
    console.log(`🔄 Pedido ${pedido.id} estornado`);
  }
  /**
   * Reserva estoque dos produtos do pedido
   */
  private async reservarEstoquePedido(pedido: Pedido): Promise<void> {
    for (const item of pedido.itens) {
      const produto = await this.produtoRepository.findOne({
        where: { id: item.produtoId }
      });
      
      if (produto && produto.estoque >= item.quantidade) {
        produto.estoque -= item.quantidade;
        await this.produtoRepository.save(produto);
        console.log(`📦 Estoque reservado: ${item.quantidade}x ${produto.nome}`);
      } else {
        console.warn(`⚠️ Estoque insuficiente para produto ${item.produtoId}`);
        // Aqui poderia emitir um evento de estoque insuficiente
      }
    }
  }

  /**
   * Libera estoque dos produtos do pedido
   */
  private async liberarEstoquePedido(pedido: Pedido): Promise<void> {
    for (const item of pedido.itens) {
      const produto = await this.produtoRepository.findOne({
        where: { id: item.produtoId }
      });
      
      if (produto) {
        produto.estoque += item.quantidade;
        await this.produtoRepository.save(produto);
        console.log(`📤 Estoque liberado: ${item.quantidade}x ${produto.nome}`);
      }
    }
  }

  // ===== MÉTODOS ESPECÍFICOS PARA LOJISTA =====

  /**
   * Lista pedidos associados às lojas do lojista
   * @param lojistaId - ID do lojista autenticado
   * @param status - Status opcional para filtrar pedidos
   * @returns Lista de pedidos das lojas do lojista
   */
  async listarPedidosDaLoja(lojistaId: string, status?: StatusPedido): Promise<Pedido[]> {
    const queryBuilder = this.pedidoRepository
      .createQueryBuilder('pedido')
      .leftJoinAndSelect('pedido.itens', 'itens')
      .leftJoinAndSelect('itens.produto', 'produto')
      .leftJoinAndSelect('produto.estabelecimento', 'estabelecimento')
      .leftJoinAndSelect('pedido.cupom', 'cupom')
      .where('estabelecimento.userId = :lojistaId', { lojistaId });

    // Filtrar por status se fornecido
    if (status) {
      queryBuilder.andWhere('pedido.status = :status', { status });
    }

    queryBuilder.orderBy('pedido.createdAt', 'DESC');

    return queryBuilder.getMany();
  }

  /**
   * Atualiza status de um pedido por um lojista
   * @param lojistaId - ID do lojista autenticado
   * @param pedidoId - ID do pedido a ser atualizado
   * @param novoStatus - Novo status do pedido
   * @returns Pedido atualizado
   */
  async atualizarStatusPedidoLojista(lojistaId: string, pedidoId: string, novoStatus: StatusPedido): Promise<Pedido> {
    // Buscar o pedido com validação de propriedade
    const pedido = await this.pedidoRepository
      .createQueryBuilder('pedido')
      .leftJoinAndSelect('pedido.itens', 'itens')
      .leftJoinAndSelect('itens.produto', 'produto')
      .leftJoinAndSelect('produto.estabelecimento', 'estabelecimento')
      .leftJoinAndSelect('pedido.cupom', 'cupom')
      .where('pedido.id = :pedidoId', { pedidoId })
      .andWhere('estabelecimento.userId = :lojistaId', { lojistaId })
      .getOne();

    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado ou você não tem permissão para alterá-lo');
    }    // Validar transições de status permitidas para lojista
    const statusAtual = pedido.status;
    const transicoesPermitidas = this.obterTransicoesPermitidas(statusAtual);

    if (!transicoesPermitidas.includes(novoStatus)) {
      throw new BadRequestException(
        `Transição de status inválida: ${statusAtual} → ${novoStatus}. ` +
        `Transições permitidas: ${transicoesPermitidas.join(', ')}`
      );
    }

    // Atualizar status
    pedido.status = novoStatus;
    await this.pedidoRepository.save(pedido);

    console.log(`🏪 Lojista ${lojistaId} atualizou status do pedido ${pedidoId}: ${statusAtual} → ${novoStatus}`);

    return pedido;
  }
  private obterTransicoesPermitidas(statusAtual: StatusPedido): StatusPedido[] {
    const transicoes = {
      [StatusPedido.PAGAMENTO_PENDENTE]: [StatusPedido.PAGO, StatusPedido.CANCELADO],
      [StatusPedido.PAGO]: [StatusPedido.EM_PREPARO, StatusPedido.CANCELADO],
      [StatusPedido.PENDENTE]: [StatusPedido.EM_PREPARO, StatusPedido.CANCELADO],
      [StatusPedido.EM_PREPARO]: [StatusPedido.ENVIADO, StatusPedido.CANCELADO],
      [StatusPedido.ENVIADO]: [StatusPedido.ENTREGUE],
      [StatusPedido.ENTREGUE]: [],
      [StatusPedido.CANCELADO]: []
    };

    return transicoes[statusAtual] || [];
  }
  // ===== MÉTODOS PARA APROVAÇÃO DE PARCEIROS =====

  /**
   * Cria estabelecimento a partir de solicitação de loja aprovada
   */
  async criarEstabelecimento(solicitacao: any, usuarioId: string): Promise<string> {
    try {
      console.log(`Criando estabelecimento para solicitação ${solicitacao.id}`);

      // Verificar se já existe estabelecimento com este CNPJ
      if (solicitacao.cnpj) {
        const estabelecimentoExistente = await this.estabelecimentoRepository.findOne({
          where: { cnpj: solicitacao.cnpj }
        });

        if (estabelecimentoExistente) {
          console.log(`Estabelecimento com CNPJ ${solicitacao.cnpj} já existe`);
          return estabelecimentoExistente.id;
        }
      }

      // Criar novo estabelecimento
      const novoEstabelecimento = this.estabelecimentoRepository.create({
        nome: solicitacao.nomeEstabelecimento || solicitacao.nome,
        cnpj: solicitacao.cnpj || '',
        descricao: solicitacao.descricaoNegocio || 'Estabelecimento aprovado via solicitação',
        telefone: solicitacao.telefone,
        email: solicitacao.email,
        endereco: solicitacao.endereco || '',
        ativo: true,
        estaAberto: true
      });

      const estabelecimentoSalvo = await this.estabelecimentoRepository.save(novoEstabelecimento);

      console.log(`Estabelecimento criado com sucesso: ${estabelecimentoSalvo.id}`);
      return estabelecimentoSalvo.id;

    } catch (err) {
      console.error(`Erro ao criar estabelecimento para solicitação ${solicitacao.id}`, err);
      throw new Error('Erro ao criar estabelecimento: ' + (err?.message || err));
    }
  }
}
