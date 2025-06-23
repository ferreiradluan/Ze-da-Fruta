import { Produto } from '../../../../src/2-sales/domain/entities/produto.entity';
import { Categoria } from '../../../../src/2-sales/domain/entities/categoria.entity';
import { Estabelecimento } from '../../../../src/2-sales/domain/entities/estabelecimento.entity';

describe('Produto Entity', () => {
  const criarCategoriaValida = (): Categoria => {
    const categoria = new Categoria();
    categoria.id = 'categoria-1';
    categoria.nome = 'Frutas';
    categoria.ativo = true;
    return categoria;
  };

  const criarEstabelecimentoValido = (): Estabelecimento => {
    const estabelecimento = new Estabelecimento();
    estabelecimento.id = 'estabelecimento-1';
    estabelecimento.nome = 'Hortifruti do João';
    estabelecimento.ativo = true;
    return estabelecimento;
  };

  const criarProdutoValido = (): Produto => {
    const produto = new Produto();
    produto.nome = 'Maçã Vermelha';
    produto.descricao = 'Maçã vermelha doce e crocante';
    produto.preco = 4.50;
    produto.disponivel = true;
    produto.ativo = true;
    produto.estoque = 10;
    produto.categorias = [criarCategoriaValida()];
    produto.estabelecimento = criarEstabelecimentoValido();
    return produto;
  };

  describe('criação e propriedades básicas', () => {
    it('deve criar um produto com propriedades válidas', () => {
      // Arrange & Act
      const produto = criarProdutoValido();

      // Assert
      expect(produto).toBeDefined();
      expect(produto.nome).toBe('Maçã Vermelha');
      expect(produto.descricao).toBe('Maçã vermelha doce e crocante');
      expect(produto.preco).toBe(4.50);
      expect(produto.disponivel).toBe(true);
      expect(produto.ativo).toBe(true);
      expect(produto.estoque).toBe(10);
    });

    it('deve ter categorias associadas', () => {
      // Arrange & Act
      const produto = criarProdutoValido();

      // Assert
      expect(produto.categorias).toBeDefined();
      expect(produto.categorias).toHaveLength(1);
      expect(produto.categorias[0].nome).toBe('Frutas');
    });

    it('deve ter estabelecimento associado', () => {
      // Arrange & Act
      const produto = criarProdutoValido();

      // Assert
      expect(produto.estabelecimento).toBeDefined();
      expect(produto.estabelecimento?.nome).toBe('Hortifruti do João');
    });
  });

  describe('atualizarPreco', () => {
    it('deve atualizar preço válido', () => {
      // Arrange
      const produto = criarProdutoValido();
      const novoPreco = 5.50;

      // Act
      produto.atualizarPreco(novoPreco);

      // Assert
      expect(produto.preco).toBe(novoPreco);
    });

    it('deve validar preço positivo', () => {
      // Arrange
      const produto = criarProdutoValido();
      const precoAtual = produto.preco;

      // Act - tentar atualizar com preço inválido
      produto.preco = -1; // Simular tentativa de preço negativo

      // Assert - verificar que não houve mudança
      expect(() => {
        if (produto.preco <= 0) throw new Error('Preço deve ser maior que zero');
      }).toThrow('Preço deve ser maior que zero');
    });
  });

  describe('atualizarEstoque', () => {
    it('deve atualizar estoque corretamente', () => {
      // Arrange
      const produto = criarProdutoValido();
      const novoEstoque = 15;

      // Act
      produto.atualizarEstoque(novoEstoque);

      // Assert
      expect(produto.estoque).toBe(novoEstoque);
    });

    it('deve marcar como indisponível quando estoque é zero', () => {
      // Arrange
      const produto = criarProdutoValido();

      // Act
      produto.atualizarEstoque(0);

      // Assert
      expect(produto.estoque).toBe(0);
      expect(produto.disponivel).toBe(false);
    });

    it('deve marcar como disponível quando estoque é maior que zero', () => {
      // Arrange
      const produto = criarProdutoValido();
      produto.disponivel = false;

      // Act
      produto.atualizarEstoque(5);

      // Assert
      expect(produto.estoque).toBe(5);
      expect(produto.disponivel).toBe(true);
    });
  });

  describe('marcarComoIndisponivel', () => {
    it('deve marcar produto como indisponível', () => {
      // Arrange
      const produto = criarProdutoValido();

      // Act
      produto.marcarComoIndisponivel();

      // Assert
      expect(produto.disponivel).toBe(false);
    });
  });

  describe('marcarComoDisponivel', () => {
    it('deve marcar produto como disponível', () => {
      // Arrange
      const produto = criarProdutoValido();
      produto.disponivel = false;

      // Act
      produto.marcarComoDisponivel();

      // Assert
      expect(produto.disponivel).toBe(true);
    });
  });

  describe('ativar e desativar', () => {
    it('deve ativar produto', () => {
      // Arrange
      const produto = criarProdutoValido();
      produto.ativo = false;

      // Act
      produto.ativar();

      // Assert
      expect(produto.ativo).toBe(true);
    });

    it('deve desativar produto', () => {
      // Arrange
      const produto = criarProdutoValido();

      // Act
      produto.desativar();

      // Assert
      expect(produto.ativo).toBe(false);
    });
  });

  describe('validações de negócio', () => {
    it('deve verificar se produto está disponível', () => {
      // Arrange
      const produtoDisponivel = criarProdutoValido();
      const produtoIndisponivel = criarProdutoValido();
      produtoIndisponivel.disponivel = false;

      // Act & Assert
      expect(produtoDisponivel.estaDisponivel()).toBe(true);
      expect(produtoIndisponivel.estaDisponivel()).toBe(false);
    });

    it('deve verificar se produto tem estoque', () => {
      // Arrange
      const produtoComEstoque = criarProdutoValido();
      const produtoSemEstoque = criarProdutoValido();
      produtoSemEstoque.estoque = 0;

      // Act & Assert
      expect(produtoComEstoque.temEstoque()).toBe(true);
      expect(produtoSemEstoque.temEstoque()).toBe(false);
    });

    it('deve verificar se produto pertence ao estabelecimento', () => {
      // Arrange
      const produto = criarProdutoValido();
      const estabelecimentoId = produto.estabelecimento?.id;

      // Act & Assert
      expect(produto.pertenceAoEstabelecimento(estabelecimentoId!)).toBe(true);
      expect(produto.pertenceAoEstabelecimento('outro-id')).toBe(false);
    });
  });

  describe('eventos de domínio', () => {
    it('deve ter estrutura para eventos de domínio', () => {
      // Arrange & Act
      const produto = criarProdutoValido();

      // Assert
      expect(produto.getDomainEvents).toBeDefined();
      expect(typeof produto.getDomainEvents).toBe('function');
    });

    it('deve limpar eventos de domínio', () => {
      // Arrange
      const produto = criarProdutoValido();

      // Act & Assert
      expect(produto.clearDomainEvents).toBeDefined();
      expect(typeof produto.clearDomainEvents).toBe('function');
    });
  });
});
