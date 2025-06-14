import { Pedido } from '../../../../src/2-sales/domain/entities/pedido.entity';
import { StatusPedido } from '../../../../src/2-sales/domain/enums/status-pedido.enum';

describe('Pedido Entity', () => {
  const criarSacolaValida = () => ({
    itens: [
      { produtoId: 'produto-1', quantidade: 2 },
      { produtoId: 'produto-2', quantidade: 1 }
    ],
    enderecoEntrega: 'Rua das Flores, 123',
    observacoes: 'Teste'
  });

  const criarEnderecoDto = () => ({
    logradouro: 'Rua das Flores',
    numero: '123',
    cep: '01234-567',
    cidade: 'São Paulo',
    estado: 'SP',
    complemento: 'Apto 2'
  });

  describe('criarNovo', () => {
    it('deve criar um novo pedido válido', () => {
      // Arrange
      const clienteId = 'client-123';
      const sacola = criarSacolaValida();

      // Act
      const pedido = Pedido.criarNovo(clienteId, sacola);

      // Assert
      expect(pedido).toBeDefined();
      expect(pedido.clienteId).toBe(clienteId);
      expect(pedido.status).toBe(StatusPedido.PAGAMENTO_PENDENTE);
      expect(pedido.valorTotal).toBeGreaterThanOrEqual(0);
      expect(pedido.observacoes).toBe(sacola.observacoes);
    });

    it('deve rejeitar sacola vazia', () => {
      // Arrange
      const clienteId = 'client-123';
      const sacolaVazia = {
        itens: [],
        enderecoEntrega: 'Rua das Flores, 123'
      };

      // Act & Assert
      expect(() => Pedido.criarNovo(clienteId, sacolaVazia))
        .toThrow();
    });

    it('deve validar quantidade de itens', () => {
      // Arrange
      const clienteId = 'client-123';
      const sacolaComQuantidadeInvalida = {
        itens: [
          { produtoId: 'produto-1', quantidade: 0 }
        ],
        enderecoEntrega: 'Rua das Flores, 123'
      };

      // Act & Assert
      expect(() => Pedido.criarNovo(clienteId, sacolaComQuantidadeInvalida))
        .toThrow();
    });
  });

  describe('confirmar', () => {
    it('deve confirmar pedido com endereço válido', () => {
      // Arrange
      const pedido = Pedido.criarNovo('client-123', criarSacolaValida());
      const endereco = criarEnderecoDto();

      // Act
      pedido.confirmar(endereco);

      // Assert
      expect(pedido.status).toBe(StatusPedido.PAGO);
    });

    it('deve processar confirmação corretamente', () => {
      // Arrange
      const pedido = Pedido.criarNovo('client-123', criarSacolaValida());
      const endereco = criarEnderecoDto();

      // Act
      const resultado = () => pedido.confirmar(endereco);

      // Assert
      expect(resultado).not.toThrow();
    });
  });

  describe('cancelar', () => {
    it('deve cancelar pedido com motivo', () => {
      // Arrange
      const pedido = Pedido.criarNovo('client-123', criarSacolaValida());
      const motivo = 'Cliente desistiu';

      // Act
      pedido.cancelar(motivo);

      // Assert
      expect(pedido.status).toBe(StatusPedido.CANCELADO);
    });

    it('deve processar cancelamento corretamente', () => {
      // Arrange
      const pedido = Pedido.criarNovo('client-123', criarSacolaValida());
      const motivo = 'Produto indisponível';

      // Act
      const resultado = () => pedido.cancelar(motivo);

      // Assert
      expect(resultado).not.toThrow();
    });
  });

  describe('calcularTotal', () => {
    it('deve calcular valor total', () => {
      // Arrange
      const pedido = Pedido.criarNovo('client-123', criarSacolaValida());

      // Act
      const valorTotal = pedido.calcularTotal();

      // Assert
      expect(valorTotal).toBeGreaterThanOrEqual(0);
      expect(typeof valorTotal).toBe('number');
    });
  });

  describe('eventos de domínio', () => {
    it('deve ter eventos de domínio após criação', () => {
      // Arrange & Act
      const pedido = Pedido.criarNovo('client-123', criarSacolaValida());

      // Assert
      const eventos = pedido.getDomainEvents();
      expect(eventos).toBeDefined();
      expect(Array.isArray(eventos)).toBe(true);
    });

    it('deve limpar eventos após getDomainEvents', () => {
      // Arrange
      const pedido = Pedido.criarNovo('client-123', criarSacolaValida());

      // Act
      const eventos = pedido.getDomainEvents();
      pedido.clearDomainEvents();
      const eventosAposLimpar = pedido.getDomainEvents();

      // Assert
      expect(eventos).toBeDefined();
      expect(eventosAposLimpar).toHaveLength(0);
    });
  });
});
