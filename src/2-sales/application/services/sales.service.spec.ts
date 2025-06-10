import { Test, TestingModule } from '@nestjs/testing';
import { SalesService } from './sales.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Produto } from '../../domain/entities/produto.entity';
import { Categoria } from '../../domain/entities/categoria.entity';
import { Estabelecimento } from '../../domain/entities/estabelecimento.entity';
import { Pedido } from '../../domain/entities/pedido.entity';
import { ItemPedido } from '../../domain/entities/item-pedido.entity';
import { Cupom } from '../../domain/entities/cupom.entity';
import { PaymentService } from '../../../4-payment/application/services/payment.service';
import { EventBusService } from '../../../common/event-bus';

const mockRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    getMany: jest.fn().mockResolvedValue([]),
  })),
};

const mockQueryBuilder = {
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  getMany: jest.fn().mockResolvedValue([]),
};

describe('SalesService', () => {
  let service: SalesService;
  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Configure the repository to return our mock query builder
    mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        {
          provide: getRepositoryToken(Produto),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Categoria),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Estabelecimento),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Pedido),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(ItemPedido),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Cupom),
          useValue: mockRepository,
        },        {
          provide: PaymentService,
          useValue: {
            criarSessaoCheckoutStripe: jest.fn().mockResolvedValue('https://checkout.stripe.com/test'),
          },
        },        {
          provide: EventBusService,
          useValue: {
            emit: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('buscarProdutosPublico', () => {
    it('should return paginated products from public catalog', async () => {
      const mockProducts = [
        {
          id: '1',
          nome: 'Banana',
          preco: 3.49,
          categoria: { nome: 'Frutas' },
          estabelecimento: { nome: 'Hortifruti Central' }
        }
      ];
      
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockProducts, 1]);
      
      const result = await service.buscarProdutosPublico({});
      
      expect(result).toEqual({
        produtos: mockProducts,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1
      });
    });

    it('should filter products by category name', async () => {
      const filtros = { categoria: 'Frutas' };
      
      await service.buscarProdutosPublico(filtros);
      
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('categoria.nome = :categoriaNome', { categoriaNome: 'Frutas' });
    });

    it('should filter products by price range', async () => {
      const filtros = { precoMin: 5, precoMax: 10 };
      
      await service.buscarProdutosPublico(filtros);
      
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('produto.preco >= :precoMin', { precoMin: 5 });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('produto.preco <= :precoMax', { precoMax: 10 });
    });
  });

  describe('listarCategoriasPublico', () => {
    it('should return all active categories', async () => {
      const mockCategorias = [
        { id: '1', nome: 'Frutas', ativo: true },
        { id: '2', nome: 'Verduras', ativo: true }
      ];
      
      mockRepository.find.mockResolvedValue(mockCategorias);
      
      const result = await service.listarCategoriasPublico();
      
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { ativo: true },
        order: { nome: 'ASC' }
      });
      expect(result).toBe(mockCategorias);
    });
  });

  describe('listarEstabelecimentosPublico', () => {
    it('should return all active establishments', async () => {
      const mockEstabelecimentos = [
        { id: '1', nome: 'Hortifruti Central', ativo: true },
        { id: '2', nome: 'Feira do Produtor', ativo: true }
      ];
      
      mockRepository.find.mockResolvedValue(mockEstabelecimentos);
      
      const result = await service.listarEstabelecimentosPublico();
      
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { ativo: true },
        order: { nome: 'ASC' }
      });
      expect(result).toBe(mockEstabelecimentos);
    });
  });

  describe('buscarProdutosPublico - advanced filtering', () => {
    it('should filter products by search term', async () => {
      const filtros = { search: 'banana' };
      
      await service.buscarProdutosPublico(filtros);
      
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(produto.nome LIKE :search OR produto.descricao LIKE :search)',
        { search: '%banana%' }
      );
    });

    it('should filter by establishment name', async () => {
      const filtros = { estabelecimento: 'Hortifruti Central' };
      
      await service.buscarProdutosPublico(filtros);
      
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'estabelecimento.nome = :estabelecimentoNome', 
        { estabelecimentoNome: 'Hortifruti Central' }
      );
    });

    it('should apply correct ordering for price ascending', async () => {
      const filtros = { ordenacao: 'preco_asc' };
      
      await service.buscarProdutosPublico(filtros);
      
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('produto.preco', 'ASC');
    });

    it('should apply correct ordering for name descending', async () => {
      const filtros = { ordenacao: 'nome_desc' };
      
      await service.buscarProdutosPublico(filtros);
      
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('produto.nome', 'DESC');
    });

    it('should apply pagination correctly', async () => {
      const filtros = { page: 2, limit: 10 };
      
      await service.buscarProdutosPublico(filtros);
      
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10); // (page - 1) * limit
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('should calculate total pages correctly', async () => {
      const mockProducts = [];
      const total = 25;
      const limit = 10;
      
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockProducts, total]);
      
      const result = await service.buscarProdutosPublico({ limit });
      
      expect(result.totalPages).toBe(3); // Math.ceil(25/10) = 3
    });
  });
});
