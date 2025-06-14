import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EstabelecimentoService } from '../../../src/2-sales/application/services/estabelecimento.service';
import { Estabelecimento } from '../../../src/2-sales/domain/entities/estabelecimento.entity';

describe('EstabelecimentoService Integration', () => {
  let service: EstabelecimentoService;
  let estabelecimentoRepository: jest.Mocked<Repository<Estabelecimento>>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const criarEstabelecimentoMock = (): Estabelecimento => {
    const estabelecimento = new Estabelecimento();
    estabelecimento.id = 'estabelecimento-1';
    estabelecimento.nome = 'Hortifruti do João';
    estabelecimento.descricao = 'Frutas, verduras e legumes frescos';
    estabelecimento.endereco = 'Rua das Flores, 123';
    estabelecimento.telefone = '(11) 99999-9999';
    estabelecimento.ativo = true;
    estabelecimento.estaAberto = true;
    estabelecimento.imagemUrl = 'https://exemplo.com/loja.jpg';
    estabelecimento.createdAt = new Date();
    estabelecimento.updatedAt = new Date();
    return estabelecimento;
  };

  beforeEach(async () => {
    const mockEstabelecimentoRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      remove: jest.fn(),
    };

    const mockEventEmitter = {
      emit: jest.fn().mockReturnValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EstabelecimentoService,
        {
          provide: getRepositoryToken(Estabelecimento),
          useValue: mockEstabelecimentoRepository,
        },
        {
          provide: 'EstabelecimentoRepository',
          useValue: {
            criar: jest.fn(),
            buscarPorId: jest.fn(),
            listarAtivos: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<EstabelecimentoService>(EstabelecimentoService);
    estabelecimentoRepository = module.get(getRepositoryToken(Estabelecimento));
    eventEmitter = module.get(EventEmitter2);
  });

  describe('listarEstabelecimentosPublico', () => {
    it('deve retornar estabelecimentos ativos para o público', async () => {
      // Arrange
      const estabelecimentosMock = [
        criarEstabelecimentoMock(),
        { ...criarEstabelecimentoMock(), id: 'estabelecimento-2', nome: 'Padaria Central' }
      ];

      estabelecimentoRepository.find.mockResolvedValue(estabelecimentosMock);

      // Act
      const resultado = await service.listarEstabelecimentosPublico();

      // Assert
      expect(resultado).toBeDefined();
      expect(Array.isArray(resultado)).toBe(true);
      expect(resultado).toHaveLength(2);
      expect(estabelecimentoRepository.find).toHaveBeenCalledWith({
        where: { ativo: true },
        select: [
          'id',
          'nome',
          'descricao',
          'endereco',
          'telefone',
          'imagemUrl',
          'estaAberto',
        ],
        order: { nome: 'ASC' },
      });
    });

    it('deve retornar array vazio quando não há estabelecimentos ativos', async () => {
      // Arrange
      estabelecimentoRepository.find.mockResolvedValue([]);

      // Act
      const resultado = await service.listarEstabelecimentosPublico();

      // Assert
      expect(resultado).toBeDefined();
      expect(Array.isArray(resultado)).toBe(true);
      expect(resultado).toHaveLength(0);
    });

    it('deve filtrar apenas estabelecimentos ativos', async () => {
      // Arrange
      const estabelecimentosComInativo = [
        criarEstabelecimentoMock(),
        { ...criarEstabelecimentoMock(), id: 'estabelecimento-2', ativo: false }
      ];

      estabelecimentoRepository.find.mockResolvedValue([estabelecimentosComInativo[0]]);

      // Act
      const resultado = await service.listarEstabelecimentosPublico();

      // Assert
      expect(resultado).toHaveLength(1);
      expect(resultado[0].ativo).toBe(true);
      expect(estabelecimentoRepository.find).toHaveBeenCalledWith({
        where: { ativo: true },
        select: expect.any(Array),
        order: { nome: 'ASC' },
      });
    });
  });

  describe('obterDetalhesLoja', () => {
    it('deve retornar detalhes de estabelecimento ativo', async () => {
      // Arrange
      const estabelecimentoId = 'estabelecimento-1';
      const estabelecimentoMock = criarEstabelecimentoMock();

      estabelecimentoRepository.findOne.mockResolvedValue(estabelecimentoMock);

      // Act
      const resultado = await service.obterDetalhesLoja(estabelecimentoId);

      // Assert
      expect(resultado).toBeDefined();
      expect(resultado.id).toBe(estabelecimentoId);
      expect(resultado.nome).toBe('Hortifruti do João');
      expect(estabelecimentoRepository.findOne).toHaveBeenCalledWith({
        where: { id: estabelecimentoId, ativo: true },
        relations: ['produtos', 'produtos.categoria'],
      });
    });

    it('deve lançar erro quando estabelecimento não existe', async () => {
      // Arrange
      const estabelecimentoIdInexistente = 'estabelecimento-inexistente';
      estabelecimentoRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.obterDetalhesLoja(estabelecimentoIdInexistente))
        .rejects.toThrow('Estabelecimento não encontrado');
    });

    it('deve incluir produtos e categorias nos detalhes', async () => {
      // Arrange
      const estabelecimentoId = 'estabelecimento-1';
      const estabelecimentoComProdutos = {
        ...criarEstabelecimentoMock(),
        produtos: [
          {
            id: 'produto-1',
            nome: 'Maçã',
            preco: 4.50,
            categoria: { id: 'cat-1', nome: 'Frutas' }
          }
        ]
      };

      estabelecimentoRepository.findOne.mockResolvedValue(estabelecimentoComProdutos as any);

      // Act
      const resultado = await service.obterDetalhesLoja(estabelecimentoId);

      // Assert
      expect(resultado.produtos).toBeDefined();
      expect(estabelecimentoRepository.findOne).toHaveBeenCalledWith({
        where: { id: estabelecimentoId, ativo: true },
        relations: ['produtos', 'produtos.categoria'],
      });
    });
  });

  describe('tratamento de erros', () => {
    it('deve propagar erros do repositório', async () => {
      // Arrange
      const erroSimulado = new Error('Erro de conexão com banco');
      estabelecimentoRepository.find.mockRejectedValue(erroSimulado);

      // Act & Assert
      await expect(service.listarEstabelecimentosPublico())
        .rejects.toThrow('Erro de conexão com banco');
    });

    it('deve tratar erro de estabelecimento não encontrado', async () => {
      // Arrange
      estabelecimentoRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.obterDetalhesLoja('id-inexistente'))
        .rejects.toThrow('Estabelecimento não encontrado');
    });
  });

  describe('validações de negócio', () => {
    it('deve retornar apenas dados públicos necessários', async () => {
      // Arrange
      const estabelecimentoCompleto = {
        ...criarEstabelecimentoMock(),
        senhaHash: 'hash-secreto',
        configuracoesPrivadas: { chaveApi: 'secreta' }
      };

      estabelecimentoRepository.find.mockResolvedValue([estabelecimentoCompleto] as any);

      // Act
      const resultado = await service.listarEstabelecimentosPublico();

      // Assert
      expect(estabelecimentoRepository.find).toHaveBeenCalledWith({
        where: { ativo: true },
        select: [
          'id',
          'nome',
          'descricao',
          'endereco',
          'telefone',
          'imagemUrl',
          'estaAberto',
        ], // Apenas campos públicos selecionados
        order: { nome: 'ASC' },
      });
    });

    it('deve ordenar estabelecimentos por nome', async () => {
      // Arrange
      const estabelecimentos = [
        { ...criarEstabelecimentoMock(), nome: 'Zebra Mercado' },
        { ...criarEstabelecimentoMock(), nome: 'Alpha Hortifruti' }
      ];

      estabelecimentoRepository.find.mockResolvedValue(estabelecimentos);

      // Act
      await service.listarEstabelecimentosPublico();

      // Assert
      expect(estabelecimentoRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { nome: 'ASC' }
        })
      );
    });
  });
});
