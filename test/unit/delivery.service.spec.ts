import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DeliveryService } from '../../src/3-delivery/application/services/delivery.service';
import { Entregador, StatusEntregador, StatusDisponibilidade } from '../../src/3-delivery/domain/entities/entregador.entity';
import { Entrega } from '../../src/3-delivery/domain/entities/entrega.entity';
import { EntregaRepository } from '../../src/3-delivery/infrastructure/repositories/entrega.repository';
import { PedidoConfirmadoEvent } from '../../src/2-sales/domain/events';
import { StatusEntrega } from '../../src/3-delivery/domain/enums/status-entrega.enum';
import { EnderecoVO } from '../../src/3-delivery/domain/value-objects/endereco.vo';

describe('DeliveryService', () => {
  let service: DeliveryService;
  let entregadorRepository: Repository<Entregador>;
  let entregaTypeOrmRepository: Repository<Entrega>;
  let entregaRepository: EntregaRepository;
  let eventEmitter: EventEmitter2;

  // Mock data
  const mockEntregador: Entregador = {
    id: 'entregador-1',
    nome: 'João Silva',
    email: 'joao@example.com',
    telefone: '11999999999',
    status: StatusEntregador.ATIVO,
    disponibilidade: StatusDisponibilidade.DISPONIVEL,
    fotoPerfil: null,
    createdAt: new Date(),
    updatedAt: new Date()
  } as Entregador;

  const mockEntrega: Entrega = {
    id: 'entrega-1',
    pedidoId: 'pedido-123',
    entregadorId: 'entregador-1',
    enderecoColeta: new EnderecoVO('Rua A', '123', 'Centro', 'São Paulo', 'SP', '01234-567'),
    enderecoEntrega: new EnderecoVO('Rua B', '456', 'Vila Nova', 'São Paulo', 'SP', '01234-890'),
    status: StatusEntrega.PENDENTE,
    valorFrete: 8.50,
    previsaoEntrega: new Date(),
    observacoes: 'Teste',
    createdAt: new Date(),
    updatedAt: new Date()
  } as Entrega;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveryService,
        {
          provide: getRepositoryToken(Entregador),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Entrega),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },        {
          provide: EntregaRepository,
          useValue: {
            criar: jest.fn(),
            buscarPorId: jest.fn(),
            buscarPorPedidoId: jest.fn(),
            buscarPorEntregadorId: jest.fn(),
            atualizar: jest.fn(),
            listarTodas: jest.fn(),
            buscarPorStatus: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();    service = module.get<DeliveryService>(DeliveryService);
    entregadorRepository = module.get<Repository<Entregador>>(getRepositoryToken(Entregador));
    entregaTypeOrmRepository = module.get<Repository<Entrega>>(getRepositoryToken(Entrega));
    entregaRepository = module.get<EntregaRepository>(EntregaRepository);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handlePedidoConfirmado', () => {    it('should create delivery when order is confirmed', async () => {
      // Arrange
      const pedidoConfirmadoEvent: PedidoConfirmadoEvent = {
        pedidoId: 'pedido-123',
        clienteId: 'cliente-456',
        valor: 50.00,
        enderecoEntrega: 'Rua B, 456, Vila Nova, São Paulo, SP, 01234-890',
        itens: [
          { produtoId: 'produto-1', nomeProduto: 'Maçã', quantidade: 2, preco: 25.00 }
        ]
      };

      // Mock repository responses
      jest.spyOn(entregadorRepository, 'find').mockResolvedValue([mockEntregador]);
      jest.spyOn(entregaRepository, 'criar').mockResolvedValue(mockEntrega);
      jest.spyOn(eventEmitter, 'emit').mockReturnValue(true);

      // Act
      await service.handlePedidoConfirmado(pedidoConfirmadoEvent);

      // Assert
      expect(entregadorRepository.find).toHaveBeenCalledWith({
        where: { 
          status: StatusEntregador.ATIVO,
          disponibilidade: StatusDisponibilidade.DISPONIVEL 
        },
        take: 1,
        order: { createdAt: 'ASC' }
      });

      expect(entregaRepository.criar).toHaveBeenCalled();
      
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'entrega.criada',
        expect.objectContaining({
          entregaId: mockEntrega.id,
          pedidoId: pedidoConfirmadoEvent.pedidoId,
          entregadorId: mockEntrega.entregadorId,
          status: mockEntrega.status,
        })
      );

      // Should also emit notification to delivery person
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'notificacao.enviar',
        expect.objectContaining({
          tipo: 'NOVA_ENTREGA_DISPONIVEL',
          destinatario: mockEntregador.id,
          titulo: 'Nova entrega disponível! 🚚',
        })
      );
    });    it('should handle case when no delivery person is available', async () => {
      // Arrange
      const pedidoConfirmadoEvent: PedidoConfirmadoEvent = {
        pedidoId: 'pedido-123',
        clienteId: 'cliente-456',
        valor: 50.00,
        enderecoEntrega: 'Rua B, 456, Vila Nova, São Paulo, SP, 01234-890',
        itens: [
          { produtoId: 'produto-1', nomeProduto: 'Maçã', quantidade: 2, preco: 25.00 }
        ]
      };      const entregaSemEntregador = Entrega.criar(
        'pedido-123',
        new EnderecoVO('Rua A', '123', 'Centro', 'São Paulo', 'SP', '01234-567'),
        new EnderecoVO('Rua B', '456', 'Vila Nova', 'São Paulo', 'SP', '01234-890'),
        8.50
      );
      entregaSemEntregador.id = 'entrega-1';
      entregaSemEntregador.status = StatusEntrega.AGUARDANDO_ACEITE;
      entregaSemEntregador.observacoes = 'Teste';

      // Mock repository responses - no delivery person available
      jest.spyOn(entregadorRepository, 'find').mockResolvedValue([]);
      jest.spyOn(entregaRepository, 'criar').mockResolvedValue(entregaSemEntregador);
      jest.spyOn(eventEmitter, 'emit').mockReturnValue(true);

      // Act
      await service.handlePedidoConfirmado(pedidoConfirmadoEvent);

      // Assert
      expect(entregaRepository.criar).toHaveBeenCalled();
      
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'entrega.criada',
        expect.objectContaining({
          entregaId: entregaSemEntregador.id,
          pedidoId: pedidoConfirmadoEvent.pedidoId,
          entregadorId: null,
          status: StatusEntrega.AGUARDANDO_ACEITE,
        })
      );

      // Should NOT emit notification to delivery person since none was assigned
      expect(eventEmitter.emit).not.toHaveBeenCalledWith(
        'notificacao.enviar',
        expect.objectContaining({
          tipo: 'NOVA_ENTREGA_DISPONIVEL',
        })
      );
    });    it('should handle errors and emit error event', async () => {
      // Arrange
      const pedidoConfirmadoEvent: PedidoConfirmadoEvent = {
        pedidoId: 'pedido-123',
        clienteId: 'cliente-456',
        valor: 50.00,
        enderecoEntrega: 'Rua B, 456, Vila Nova, São Paulo, SP, 01234-890',
        itens: [
          { produtoId: 'produto-1', nomeProduto: 'Maçã', quantidade: 2, preco: 25.00 }
        ]
      };

      const errorMessage = 'Database connection failed';
      
      // Mock repository to throw error
      jest.spyOn(entregadorRepository, 'find').mockRejectedValue(new Error(errorMessage));
      jest.spyOn(eventEmitter, 'emit').mockReturnValue(true);

      // Act & Assert
      await expect(service.handlePedidoConfirmado(pedidoConfirmadoEvent)).rejects.toThrow(errorMessage);
      
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'entrega.erro_criacao',
        {
          pedidoId: pedidoConfirmadoEvent.pedidoId,
          erro: errorMessage,
          timestamp: expect.any(Date)
        }
      );    });
  });  describe('buscarEntregasDisponiveis', () => {
    it('should return available deliveries successfully', async () => {
      // Arrange
      const entregaDisponivel1 = new Entrega();
      Object.assign(entregaDisponivel1, {
        id: 'entrega-disponivel-1',
        pedidoId: 'pedido-123',
        entregadorId: null,
        status: StatusEntrega.AGUARDANDO_ACEITE,
        enderecoColeta: new EnderecoVO('Rua A', '123', 'Centro', 'São Paulo', 'SP', '01234-567'),
        enderecoEntrega: new EnderecoVO('Rua B', '456', 'Vila Nova', 'São Paulo', 'SP', '01234-890'),
        valorFrete: 8.50,
        previsaoEntrega: new Date(),
        observacoes: 'Teste',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const entregaDisponivel2 = new Entrega();
      Object.assign(entregaDisponivel2, {
        id: 'entrega-disponivel-2',
        pedidoId: 'pedido-456',
        entregadorId: null,
        status: StatusEntrega.AGUARDANDO_ACEITE,
        enderecoColeta: new EnderecoVO('Rua C', '789', 'Centro', 'São Paulo', 'SP', '01234-567'),
        enderecoEntrega: new EnderecoVO('Rua D', '321', 'Vila Nova', 'São Paulo', 'SP', '01234-890'),
        valorFrete: 12.00,
        previsaoEntrega: new Date(),
        observacoes: 'Teste 2',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const mockEntregasDisponiveis = [entregaDisponivel1, entregaDisponivel2];

      jest.spyOn(entregaRepository, 'buscarPorStatus').mockResolvedValue(mockEntregasDisponiveis);

      // Act
      const result = await service.buscarEntregasDisponiveis();

      // Assert
      expect(entregaRepository.buscarPorStatus).toHaveBeenCalledWith(StatusEntrega.AGUARDANDO_ACEITE);
      expect(result).toEqual(mockEntregasDisponiveis);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no deliveries are available', async () => {
      // Arrange
      jest.spyOn(entregaRepository, 'buscarPorStatus').mockResolvedValue([]);

      // Act
      const result = await service.buscarEntregasDisponiveis();

      // Assert
      expect(entregaRepository.buscarPorStatus).toHaveBeenCalledWith(StatusEntrega.AGUARDANDO_ACEITE);
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const errorMessage = 'Database connection failed';
      jest.spyOn(entregaRepository, 'buscarPorStatus').mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(service.buscarEntregasDisponiveis()).rejects.toThrow('Erro ao buscar entregas disponíveis');
    });
  });

  describe('aceitarEntrega', () => {
    it('should accept delivery successfully', async () => {
      // Arrange
      const entregaId = 'entrega-1';
      const entregadorId = 'entregador-1';
      
      const mockEntregaDisponivel = new Entrega();
      Object.assign(mockEntregaDisponivel, {
        id: entregaId,
        pedidoId: 'pedido-123',
        entregadorId: null,
        status: StatusEntrega.AGUARDANDO_ACEITE,
        enderecoColeta: new EnderecoVO('Rua A', '123', 'Centro', 'São Paulo', 'SP', '01234-567'),
        enderecoEntrega: new EnderecoVO('Rua B', '456', 'Vila Nova', 'São Paulo', 'SP', '01234-890'),
        valorFrete: 8.50,
        previsaoEntrega: new Date(),
        observacoes: 'Teste',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const mockEntregaAceita = new Entrega();
      Object.assign(mockEntregaAceita, {
        id: entregaId,
        pedidoId: 'pedido-123',
        entregadorId: entregadorId,
        status: StatusEntrega.PENDENTE,
        enderecoColeta: new EnderecoVO('Rua A', '123', 'Centro', 'São Paulo', 'SP', '01234-567'),
        enderecoEntrega: new EnderecoVO('Rua B', '456', 'Vila Nova', 'São Paulo', 'SP', '01234-890'),
        valorFrete: 8.50,
        previsaoEntrega: new Date(),
        observacoes: 'Teste',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      jest.spyOn(entregaRepository, 'buscarPorId').mockResolvedValue(mockEntregaDisponivel);
      jest.spyOn(entregadorRepository, 'findOne').mockResolvedValue(mockEntregador);
      jest.spyOn(entregaRepository, 'atualizar').mockResolvedValue(mockEntregaAceita);
      jest.spyOn(eventEmitter, 'emit').mockReturnValue(true);

      // Act
      const result = await service.aceitarEntrega(entregaId, entregadorId);

      // Assert
      expect(entregaRepository.buscarPorId).toHaveBeenCalledWith(entregaId);
      expect(entregadorRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: entregadorId,
          status: StatusEntregador.ATIVO,
          disponibilidade: StatusDisponibilidade.DISPONIVEL
        }
      });
      expect(entregaRepository.atualizar).toHaveBeenCalledWith(mockEntregaDisponivel);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'entrega.aceita',
        expect.objectContaining({
          entregaId,
          entregadorId,
          entregadorNome: mockEntregador.nome,
          pedidoId: mockEntregaDisponivel.pedidoId,
          status: StatusEntrega.PENDENTE
        })
      );
      expect(result).toEqual(mockEntregaAceita);
    });

    it('should throw NotFoundException when delivery not found', async () => {
      // Arrange
      const entregaId = 'entrega-inexistente';
      const entregadorId = 'entregador-1';

      jest.spyOn(entregaRepository, 'buscarPorId').mockResolvedValue(null);

      // Act & Assert
      await expect(service.aceitarEntrega(entregaId, entregadorId)).rejects.toThrow('Entrega não encontrada');
    });

    it('should throw ForbiddenException when delivery is not available for acceptance', async () => {
      // Arrange
      const entregaId = 'entrega-1';
      const entregadorId = 'entregador-1';
      
      const mockEntregaJaAceita = new Entrega();
      Object.assign(mockEntregaJaAceita, {
        id: entregaId,
        pedidoId: 'pedido-123',
        entregadorId: 'outro-entregador',
        status: StatusEntrega.PENDENTE,
        enderecoColeta: new EnderecoVO('Rua A', '123', 'Centro', 'São Paulo', 'SP', '01234-567'),
        enderecoEntrega: new EnderecoVO('Rua B', '456', 'Vila Nova', 'São Paulo', 'SP', '01234-890'),
        valorFrete: 8.50,
        previsaoEntrega: new Date(),
        observacoes: 'Teste',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      jest.spyOn(entregaRepository, 'buscarPorId').mockResolvedValue(mockEntregaJaAceita);

      // Act & Assert
      await expect(service.aceitarEntrega(entregaId, entregadorId)).rejects.toThrow('Esta entrega não está mais disponível para aceite');
    });

    it('should throw ForbiddenException when delivery driver is not available', async () => {
      // Arrange
      const entregaId = 'entrega-1';
      const entregadorId = 'entregador-indisponivel';
      
      const mockEntregaDisponivel = new Entrega();
      Object.assign(mockEntregaDisponivel, {
        id: entregaId,
        pedidoId: 'pedido-123',
        entregadorId: null,
        status: StatusEntrega.AGUARDANDO_ACEITE,
        enderecoColeta: new EnderecoVO('Rua A', '123', 'Centro', 'São Paulo', 'SP', '01234-567'),
        enderecoEntrega: new EnderecoVO('Rua B', '456', 'Vila Nova', 'São Paulo', 'SP', '01234-890'),
        valorFrete: 8.50,
        previsaoEntrega: new Date(),
        observacoes: 'Teste',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      jest.spyOn(entregaRepository, 'buscarPorId').mockResolvedValue(mockEntregaDisponivel);
      jest.spyOn(entregadorRepository, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(service.aceitarEntrega(entregaId, entregadorId)).rejects.toThrow('Entregador não está disponível para aceitar entregas');
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const entregaId = 'entrega-1';
      const entregadorId = 'entregador-1';
      const errorMessage = 'Database connection failed';

      jest.spyOn(entregaRepository, 'buscarPorId').mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(service.aceitarEntrega(entregaId, entregadorId)).rejects.toThrow('Erro interno ao aceitar entrega');
    });
  });
});
