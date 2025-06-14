import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SalesService } from '../../../src/2-sales/application/services/sales.service';
import { Pedido } from '../../../src/2-sales/domain/entities/pedido.entity';
import { Produto } from '../../../src/2-sales/domain/entities/produto.entity';
import { StatusPedido } from '../../../src/2-sales/domain/enums/status-pedido.enum';

describe('SalesService Integration', () => {
  let service: SalesService;
  let pedidoRepository: jest.Mocked<Repository<Pedido>>;
  let produtoRepository: jest.Mocked<Repository<Produto>>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const criarSacolaValida = () => ({
    itens: [
      { produtoId: 'produto-1', quantidade: 2 },
      { produtoId: 'produto-2', quantidade: 1 }
    ],
    enderecoEntrega: 'Rua das Flores, 123',
    observacoes: 'Teste de integração'
  });

  const criarProdutoMock = (id: string, preco: number): Produto => {
    const produto = new Produto();
    produto.id = id;
    produto.nome = `Produto ${id}`;
    produto.preco = preco;
    produto.disponivel = true;
    produto.ativo = true;
    produto.estoque = 10;
    return produto;
  };

  const criarPedidoMock = (clienteId: string): Pedido => {
    const pedido = new Pedido();
    pedido.id = 'pedido-123';
    pedido.clienteId = clienteId;
    pedido.status = StatusPedido.PAGAMENTO_PENDENTE;
    pedido.valorTotal = 15.50;
    pedido.observacoes = 'Teste';
    pedido.createdAt = new Date();
    pedido.updatedAt = new Date();
    pedido.getDomainEvents = jest.fn(() => [
      {
        eventName: 'pedido.criado',
        payload: { pedidoId: pedido.id, clienteId },
        timestamp: new Date()
      }
    ]);
    pedido.clearDomainEvents = jest.fn();
    return pedido;
  };

  beforeEach(async () => {
    const mockPedidoRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      remove: jest.fn(),
    };

    const mockProdutoRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
    };

    const mockEventEmitter = {
      emit: jest.fn().mockReturnValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        {
          provide: getRepositoryToken(Pedido),
          useValue: mockPedidoRepository,
        },
        {
          provide: getRepositoryToken(Produto),
          useValue: mockProdutoRepository,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
    pedidoRepository = module.get(getRepositoryToken(Pedido));
    produtoRepository = module.get(getRepositoryToken(Produto));
    eventEmitter = module.get(EventEmitter2);
  });

  describe('criarPedido', () => {
    it('deve criar pedido e emitir eventos', async () => {
      // Arrange
      const clienteId = 'client-123';
      const sacola = criarSacolaValida();
      
      const produto1 = criarProdutoMock('produto-1', 5.00);
      const produto2 = criarProdutoMock('produto-2', 3.50);
      const pedidoMock = criarPedidoMock(clienteId);

      produtoRepository.findOne
        .mockResolvedValueOnce(produto1)
        .mockResolvedValueOnce(produto2);
      
      // Mock do Pedido.criarNovo através de jest.spyOn
      jest.spyOn(Pedido, 'criarNovo').mockReturnValue(pedidoMock);
      pedidoRepository.save.mockResolvedValue(pedidoMock);

      // Act
      const resultado = await service.criarPedido(clienteId, sacola);

      // Assert
      expect(resultado).toBeDefined();
      expect(resultado.id).toBe(pedidoMock.id);
      expect(pedidoRepository.save).toHaveBeenCalledWith(pedidoMock);
      
      // Verificar que eventos foram emitidos
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'pedido.criado',
        expect.objectContaining({
          pedidoId: pedidoMock.id,
          clienteId
        })
      );
    });

    it('deve validar produtos antes de criar pedido', async () => {
      // Arrange
      const clienteId = 'client-123';
      const sacolaComProdutoInexistente = {
        itens: [
          { produtoId: 'produto-inexistente', quantidade: 1 }
        ],
        enderecoEntrega: 'Rua das Flores, 123'
      };

      produtoRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.criarPedido(clienteId, sacolaComProdutoInexistente))
        .rejects.toThrow('Produto não encontrado');
    });

    it('deve verificar disponibilidade dos produtos', async () => {
      // Arrange
      const clienteId = 'client-123';
      const sacola = criarSacolaValida();
      
      const produtoIndisponivel = criarProdutoMock('produto-1', 5.00);
      produtoIndisponivel.disponivel = false;

      produtoRepository.findOne.mockResolvedValue(produtoIndisponivel);

      // Act & Assert
      await expect(service.criarPedido(clienteId, sacola))
        .rejects.toThrow('Produto indisponível');
    });
  });

  describe('obterPedido', () => {
    it('deve retornar pedido existente do cliente', async () => {
      // Arrange
      const pedidoId = 'pedido-123';
      const clienteId = 'client-123';
      const pedidoMock = criarPedidoMock(clienteId);

      pedidoRepository.findOne.mockResolvedValue(pedidoMock);

      // Act
      const resultado = await service.obterPedido(pedidoId, clienteId);

      // Assert
      expect(resultado).toBeDefined();
      expect(resultado.id).toBe(pedidoId);
      expect(pedidoRepository.findOne).toHaveBeenCalledWith({
        where: { id: pedidoId, clienteId },
        relations: ['itens', 'itens.produto']
      });
    });

    it('deve rejeitar acesso a pedido de outro cliente', async () => {
      // Arrange
      const pedidoId = 'pedido-123';
      const clienteId = 'client-123';

      pedidoRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.obterPedido(pedidoId, clienteId))
        .rejects.toThrow('Pedido não encontrado');
    });
  });

  describe('confirmarPedido', () => {
    it('deve confirmar pedido e emitir evento', async () => {
      // Arrange
      const pedidoId = 'pedido-123';
      const endereco = 'Rua das Flores, 123, Centro, São Paulo, SP';
      const pedidoMock = criarPedidoMock('client-123');
      
      // Mock do método confirmar
      pedidoMock.confirmar = jest.fn();
      pedidoMock.getDomainEvents = jest.fn(() => [
        {
          eventName: 'pedido.confirmado',
          payload: { pedidoId: pedidoMock.id },
          timestamp: new Date()
        }
      ]);

      pedidoRepository.findOne.mockResolvedValue(pedidoMock);
      pedidoRepository.save.mockResolvedValue(pedidoMock);

      // Act
      const resultado = await service.confirmarPedido(pedidoId, endereco);

      // Assert
      expect(resultado).toBeDefined();
      expect(pedidoMock.confirmar).toHaveBeenCalledWith({
        logradouro: expect.any(String),
        numero: expect.any(String),
        cidade: expect.any(String),
        estado: expect.any(String),
        cep: expect.any(String)
      });
      expect(pedidoRepository.save).toHaveBeenCalledWith(pedidoMock);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'pedido.confirmado',
        expect.objectContaining({
          pedidoId: pedidoMock.id
        })
      );
    });

    it('deve rejeitar confirmação de pedido inexistente', async () => {
      // Arrange
      const pedidoId = 'pedido-inexistente';
      const endereco = 'Rua das Flores, 123';

      pedidoRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.confirmarPedido(pedidoId, endereco))
        .rejects.toThrow('Pedido não encontrado');
    });
  });

  describe('aplicarCupomAoPedido', () => {
    it('deve aplicar cupom válido ao pedido', async () => {
      // Arrange
      const pedidoId = 'pedido-123';
      const codigoCupom = 'DESCONTO10';
      const pedidoMock = criarPedidoMock('client-123');
      
      // Mock do método aplicarCupom
      pedidoMock.aplicarCupom = jest.fn();

      pedidoRepository.findOne.mockResolvedValue(pedidoMock);
      pedidoRepository.save.mockResolvedValue(pedidoMock);

      // Act
      const resultado = await service.aplicarCupomAoPedido(pedidoId, codigoCupom);

      // Assert
      expect(resultado).toBeDefined();
      expect(pedidoRepository.save).toHaveBeenCalledWith(pedidoMock);
    });

    it('deve rejeitar cupom em pedido inexistente', async () => {
      // Arrange
      const pedidoId = 'pedido-inexistente';
      const codigoCupom = 'DESCONTO10';

      pedidoRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.aplicarCupomAoPedido(pedidoId, codigoCupom))
        .rejects.toThrow('Pedido não encontrado');
    });
  });

  describe('buscarProdutosPublico', () => {
    it('deve retornar produtos públicos com filtros', async () => {
      // Arrange
      const filtros = {
        nome: 'maçã',
        categoria: 'frutas',
        page: 1,
        limit: 10
      };

      const produtosMock = [
        criarProdutoMock('produto-1', 4.50),
        criarProdutoMock('produto-2', 5.00)
      ];

      produtoRepository.find.mockResolvedValue(produtosMock);

      // Act
      const resultado = await service.buscarProdutosPublico(filtros);

      // Assert
      expect(resultado).toBeDefined();
      expect(Array.isArray(resultado.data)).toBe(true);
      expect(resultado.data).toHaveLength(2);
      expect(produtoRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.any(Object),
          take: filtros.limit,
          skip: 0
        })
      );
    });

    it('deve aplicar paginação corretamente', async () => {
      // Arrange
      const filtros = {
        page: 2,
        limit: 5
      };

      produtoRepository.find.mockResolvedValue([]);

      // Act
      await service.buscarProdutosPublico(filtros);

      // Assert
      expect(produtoRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
          skip: 5 // (page - 1) * limit = (2 - 1) * 5 = 5
        })
      );
    });
  });

  describe('tratamento de eventos', () => {
    it('deve publicar eventos de domínio após operações', async () => {
      // Arrange
      const clienteId = 'client-123';
      const sacola = criarSacolaValida();
      const pedidoMock = criarPedidoMock(clienteId);

      jest.spyOn(Pedido, 'criarNovo').mockReturnValue(pedidoMock);
      produtoRepository.findOne.mockResolvedValue(criarProdutoMock('produto-1', 5.00));
      pedidoRepository.save.mockResolvedValue(pedidoMock);

      // Act
      await service.criarPedido(clienteId, sacola);

      // Assert
      expect(pedidoMock.getDomainEvents).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalled();
      expect(pedidoMock.clearDomainEvents).toHaveBeenCalled();
    });
  });
});
