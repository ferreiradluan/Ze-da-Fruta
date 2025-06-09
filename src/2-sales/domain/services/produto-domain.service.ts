import { Produto, StatusProduto } from '../entities/produto.entity';
import { Categoria } from '../entities/categoria.entity';
import { Dinheiro } from '../value-objects/dinheiro.vo';
import { 
  ProdutoInvalidoError,
  ProdutoInativoError,
  EstoqueInsuficienteError,
  PrecoProdutoInvalidoError
} from '../errors/produto.errors';
import { DomainEventDispatcher } from '../../../common/domain/events/domain-event.base';

export interface ProdutoRepository {
  buscarPorNome(nome: string): Promise<Produto[]>;
  buscarPorCategoria(categoriaId: string): Promise<Produto[]>;
  verificarNomeUnico(nome: string, produtoId?: string): Promise<boolean>;
}

export interface CategoriaRepository {
  buscarPorId(id: string): Promise<Categoria | null>;
  buscarPorNome(nome: string): Promise<Categoria[]>;
}

/**
 * Serviço de domínio para operações complexas de produtos
 * que envolvem validações de negócio e múltiplas entidades
 */
export class ProdutoDomainService {
  constructor(
    private readonly eventDispatcher: DomainEventDispatcher,
    private readonly produtoRepository: ProdutoRepository,
    private readonly categoriaRepository: CategoriaRepository
  ) {}

  /**
   * Cria produto com validações completas
   */
  async criarProdutoCompleto(
    dados: {
      nome: string;
      descricao: string;
      preco: number;
      categoriaId: string;
      quantidadeEstoque: number;
      peso?: number;
      dimensoes?: string;
      imagemUrl?: string;
      codigoBarras?: string;
    },
    lojistaId: string
  ): Promise<Produto> {
    // Validar unicidade do nome
    const nomeUnico = await this.produtoRepository.verificarNomeUnico(dados.nome);
    if (!nomeUnico) {
      throw new ProdutoInvalidoError('Já existe um produto com este nome');
    }

    // Validar categoria
    const categoria = await this.categoriaRepository.buscarPorId(dados.categoriaId);
    if (!categoria) {
      throw new ProdutoInvalidoError('Categoria não encontrada');
    }

    if (!categoria.ativo) {
      throw new ProdutoInvalidoError('Não é possível criar produto em categoria inativa');
    }

    // Criar produto
    const produto = Produto.criar({
      nome: dados.nome,
      descricao: dados.descricao,
      preco: dados.preco,
      categoriaId: dados.categoriaId,
      quantidadeEstoque: dados.quantidadeEstoque,
      peso: dados.peso,
      dimensoes: dados.dimensoes,
      imagemUrl: dados.imagemUrl,
      codigoBarras: dados.codigoBarras,
      lojistaId
    });

    return produto;
  }

  /**
   * Atualiza produto com validações
   */
  async atualizarProdutoCompleto(
    produto: Produto,
    dados: {
      nome?: string;
      descricao?: string;
      preco?: number;
      categoriaId?: string;
      peso?: number;
      dimensoes?: string;
      imagemUrl?: string;
    }
  ): Promise<void> {
    // Validar nome único se alterado
    if (dados.nome && dados.nome !== produto.nome) {
      const nomeUnico = await this.produtoRepository.verificarNomeUnico(dados.nome, produto.id);
      if (!nomeUnico) {
        throw new ProdutoInvalidoError('Já existe um produto com este nome');
      }
    }

    // Validar categoria se alterada
    if (dados.categoriaId && dados.categoriaId !== produto.categoriaId) {
      const categoria = await this.categoriaRepository.buscarPorId(dados.categoriaId);
      if (!categoria) {
        throw new ProdutoInvalidoError('Categoria não encontrada');
      }

      if (!categoria.ativo) {
        throw new ProdutoInvalidoError('Não é possível mover produto para categoria inativa');
      }
    }

    // Aplicar atualizações
    produto.atualizar(dados);
  }

  /**
   * Aplica promoção a um produto com validações
   */
  aplicarPromocaoComValidacoes(
    produto: Produto,
    dadosPromocao: {
      nome: string;
      percentualDesconto: number;
      dataInicio: Date;
      dataFim: Date;
      quantidadeMaxima?: number;
    }
  ): void {
    if (!produto.estaAtivo()) {
      throw new ProdutoInativoError();
    }

    // Validar datas
    if (dadosPromocao.dataInicio >= dadosPromocao.dataFim) {
      throw new ProdutoInvalidoError('Data de início deve ser anterior à data de fim');
    }

    if (dadosPromocao.dataInicio < new Date()) {
      throw new ProdutoInvalidoError('Data de início não pode ser no passado');
    }

    // Validar percentual
    if (dadosPromocao.percentualDesconto <= 0 || dadosPromocao.percentualDesconto > 90) {
      throw new ProdutoInvalidoError('Percentual de desconto deve estar entre 1% e 90%');
    }

    // Aplicar promoção
    produto.aplicarPromocao(
      dadosPromocao.nome,
      dadosPromocao.percentualDesconto,
      dadosPromocao.dataInicio,
      dadosPromocao.dataFim,
      dadosPromocao.quantidadeMaxima
    );
  }

  /**
   * Ajusta estoque com validações e histórico
   */
  ajustarEstoqueComMotivo(
    produto: Produto,
    novaQuantidade: number,
    motivo: 'ENTRADA' | 'SAIDA' | 'CORRECAO' | 'PERDA',
    observacoes?: string
  ): void {
    if (!produto.estaAtivo()) {
      throw new ProdutoInativoError();
    }

    const quantidadeAtual = produto.quantidadeEstoque;
    const diferenca = novaQuantidade - quantidadeAtual;

    // Validar ajuste
    if (motivo === 'SAIDA' && diferenca > 0) {
      throw new ProdutoInvalidoError('Motivo SAIDA não pode aumentar estoque');
    }

    if (motivo === 'ENTRADA' && diferenca < 0) {
      throw new ProdutoInvalidoError('Motivo ENTRADA não pode diminuir estoque');
    }

    if (novaQuantidade < 0) {
      throw new ProdutoInvalidoError('Quantidade em estoque não pode ser negativa');
    }

    // Ajustar estoque
    produto.ajustarEstoque(novaQuantidade);

    // Aqui poderia ser registrado o histórico de movimentação
    // em um serviço de histórico ou evento específico
  }

  /**
   * Calcula preço promocional dinâmico baseado em critérios
   */
  calcularPrecoPromocionalDinamico(
    produto: Produto,
    criterios: {
      quantidadeVendidaUltimoMes: number;
      tempoSemVenda: number; // dias
      nivelEstoque: 'BAIXO' | 'MEDIO' | 'ALTO';
    }
  ): Dinheiro | null {
    if (!produto.estaAtivo()) {
      return null;
    }

    let percentualDesconto = 0;

    // Produto com baixa saída
    if (criterios.quantidadeVendidaUltimoMes < 5) {
      percentualDesconto += 10;
    }

    // Produto parado há muito tempo
    if (criterios.tempoSemVenda > 30) {
      percentualDesconto += 15;
    } else if (criterios.tempoSemVenda > 15) {
      percentualDesconto += 5;
    }

    // Nível de estoque alto
    if (criterios.nivelEstoque === 'ALTO') {
      percentualDesconto += 5;
    }

    // Limitar desconto máximo
    percentualDesconto = Math.min(percentualDesconto, 30);

    if (percentualDesconto > 0) {
      const valorDesconto = produto.preco.valor * (percentualDesconto / 100);
      return Dinheiro.criar(produto.preco.valor - valorDesconto);
    }

    return null;
  }

  /**
   * Valida se produto pode ser removido
   */
  async validarRemocaoProduto(produto: Produto): Promise<void> {
    if (produto.quantidadeEstoque > 0) {
      throw new ProdutoInvalidoError('Produto com estoque não pode ser removido');
    }

    if (produto.temPromocaoAtiva()) {
      throw new ProdutoInvalidoError('Produto com promoção ativa não pode ser removido');
    }

    // Aqui poderia verificar se há pedidos pendentes com este produto
    // através de um repositório de pedidos
  }

  /**
   * Sugere produtos relacionados baseado em categoria e preço
   */
  async sugerirProdutosRelacionados(
    produto: Produto,
    limite: number = 5
  ): Promise<Produto[]> {
    // Buscar produtos da mesma categoria
    const produtosMesmaCategoria = await this.produtoRepository.buscarPorCategoria(
      produto.categoriaId
    );

    // Filtrar produtos ativos e diferentes do produto atual
    const produtosFiltrados = produtosMesmaCategoria
      .filter(p => p.id !== produto.id && p.estaAtivo())
      .filter(p => {
        // Filtrar por faixa de preço similar (±50%)
        const precoMinimo = produto.preco.valor * 0.5;
        const precoMaximo = produto.preco.valor * 1.5;
        return p.preco.valor >= precoMinimo && p.preco.valor <= precoMaximo;
      })
      .sort(() => Math.random() - 0.5) // Embaralhar
      .slice(0, limite);

    return produtosFiltrados;
  }

  /**
   * Calcula métricas de performance do produto
   */
  calcularMetricasPerformance(
    produto: Produto,
    dadosVenda: {
      quantidadeVendidaUltimoMes: number;
      receitaUltimoMes: number;
      avaliacaoMedia: number;
      numeroAvaliacoes: number;
    }
  ): {
    score: number;
    categoria: 'BAIXO' | 'MEDIO' | 'ALTO';
    recomendacoes: string[];
  } {
    let score = 0;
    const recomendacoes: string[] = [];

    // Avaliar vendas
    if (dadosVenda.quantidadeVendidaUltimoMes > 50) {
      score += 30;
    } else if (dadosVenda.quantidadeVendidaUltimoMes > 20) {
      score += 20;
    } else if (dadosVenda.quantidadeVendidaUltimoMes > 5) {
      score += 10;
    } else {
      recomendacoes.push('Considerar promoção para aumentar vendas');
    }

    // Avaliar receita
    if (dadosVenda.receitaUltimoMes > 1000) {
      score += 25;
    } else if (dadosVenda.receitaUltimoMes > 500) {
      score += 15;
    } else if (dadosVenda.receitaUltimoMes > 100) {
      score += 5;
    }

    // Avaliar satisfação do cliente
    if (dadosVenda.avaliacaoMedia >= 4.5) {
      score += 20;
    } else if (dadosVenda.avaliacaoMedia >= 4.0) {
      score += 15;
    } else if (dadosVenda.avaliacaoMedia >= 3.5) {
      score += 10;
    } else {
      recomendacoes.push('Melhorar qualidade do produto');
    }

    // Avaliar engajamento
    if (dadosVenda.numeroAvaliacoes > 20) {
      score += 15;
    } else if (dadosVenda.numeroAvaliacoes > 10) {
      score += 10;
    } else if (dadosVenda.numeroAvaliacoes > 5) {
      score += 5;
    } else {
      recomendacoes.push('Incentivar avaliações dos clientes');
    }

    // Avaliar estoque
    if (produto.quantidadeEstoque === 0) {
      score -= 20;
      recomendacoes.push('Repor estoque urgentemente');
    } else if (produto.quantidadeEstoque < 10) {
      score -= 10;
      recomendacoes.push('Estoque baixo - considerar reposição');
    }

    // Determinar categoria
    let categoria: 'BAIXO' | 'MEDIO' | 'ALTO';
    if (score >= 70) {
      categoria = 'ALTO';
    } else if (score >= 40) {
      categoria = 'MEDIO';
    } else {
      categoria = 'BAIXO';
    }

    return { score, categoria, recomendacoes };
  }
}
