import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { PartnerOnboardingService } from '../partner-onboarding.service';
import { SolicitacaoParceiroRepository } from '../../../infrastructure/repositories/solicitacao-parceiro.repository';
import { EventBusService } from '../../../../common/event-bus/event-bus.service';
import { SolicitacaoParceiro } from '../../../domain/entities/solicitacao-parceiro.entity';

describe('PartnerOnboardingService', () => {
  let service: PartnerOnboardingService;
  let solicitacaoRepository: jest.Mocked<SolicitacaoParceiroRepository>;
  let eventBusService: jest.Mocked<EventBusService>;

  const mockSolicitacaoLojistaDto = {
    nome: 'João Silva',
    email: 'joao.silva@email.com',
    telefone: '11987654321',
    cpf: '12345678901',
    cnpj: '12345678000195',
    nomeEstabelecimento: 'Hortifruti do João',
    descricaoNegocio: 'Venda de frutas, verduras e legumes frescos',
    endereco: 'Rua das Flores',
    numeroEndereco: '123',
    bairro: 'Centro',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01234567'
  };

  const mockSolicitacaoEntregadorDto = {
    nome: 'Carlos Santos',
    email: 'carlos.santos@email.com',
    telefone: '11987654321',
    cpf: '98765432101',
    tipoVeiculo: 'moto',
    modeloVeiculo: 'Honda CG 160',
    placaVeiculo: 'ABC-1234',
    numeroCNH: '12345678901',
    endereco: 'Rua das Palmeiras',
    numeroEndereco: '456',
    complemento: 'Apto 2',
    bairro: 'Vila Nova',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '87654321'
  };

  beforeEach(async () => {    const mockRepository = {
      criar: jest.fn(),
      buscarPorEmail: jest.fn(),
      buscarPorCpf: jest.fn(),
      buscarPorCnpj: jest.fn(),
      buscarPorId: jest.fn(),
      contar: jest.fn(),
      contarPorTipo: jest.fn(),
      contarPorStatus: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      buscarPorStatus: jest.fn(),
    };    const mockEventBusService = {
      emit: jest.fn().mockResolvedValue(undefined),
      publish: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PartnerOnboardingService,
        {
          provide: SolicitacaoParceiroRepository,
          useValue: mockRepository,
        },
        {
          provide: EventBusService,
          useValue: mockEventBusService,
        },
      ],
    }).compile();

    service = module.get<PartnerOnboardingService>(PartnerOnboardingService);
    solicitacaoRepository = module.get(SolicitacaoParceiroRepository);
    eventBusService = module.get(EventBusService);
  });

  describe('criarSolicitacaoLojista', () => {
    it('should create a store partner request successfully', async () => {      // Arrange
      const mockSolicitacao = new SolicitacaoParceiro();
      Object.assign(mockSolicitacao, {
        id: 'solicitacao-1',
        tipo: 'LOJISTA', // String ao invés de enum
        status: 'PENDENTE', // String ao invés de enum
        email: mockSolicitacaoLojistaDto.email,
        dados: mockSolicitacaoLojistaDto, // Dados armazenados como JSON
        createdAt: new Date(),
        updatedAt: new Date()
      });      solicitacaoRepository.findOne.mockResolvedValue(null);
      solicitacaoRepository.create.mockReturnValue(mockSolicitacao);
      solicitacaoRepository.save.mockResolvedValue(mockSolicitacao);
      eventBusService.publish.mockImplementation(() => {});

      // Act
      const result = await service.criarSolicitacaoLojista(mockSolicitacaoLojistaDto);      // Assert
      expect(solicitacaoRepository.findOne).toHaveBeenCalledWith({ where: { email: mockSolicitacaoLojistaDto.email } });
      expect(solicitacaoRepository.create).toHaveBeenCalled();
      expect(solicitacaoRepository.save).toHaveBeenCalled();      expect(eventBusService.publish).toHaveBeenCalledWith(
        'solicitacao.recebida',
        expect.objectContaining({
          solicitacaoId: mockSolicitacao.id,
          tipo: 'LOJISTA', // String ao invés de enum
          nome: mockSolicitacao.dados.nome,
          email: mockSolicitacao.email,
          telefone: mockSolicitacao.dados.telefone,
          cpf: mockSolicitacao.dados.cpf,
          timestamp: expect.any(Date)
        })
      );
      expect(result).toBeDefined();
      expect(result.id).toBe(mockSolicitacao.id);
    });

    // Continuar com os outros testes, sempre usando strings...
  });
  describe('obterEstatisticas', () => {
    it('should return statistics successfully', async () => {
      // Arrange
      const expectedLojistas = 70;
      const expectedEntregadores = 30;

      solicitacaoRepository.contarPorTipo.mockImplementation((tipo) => {
        if (tipo === 'LOJISTA') return Promise.resolve(expectedLojistas);
        if (tipo === 'ENTREGADOR') return Promise.resolve(expectedEntregadores);
        return Promise.resolve(0);
      });

      // Act
      const result = await service.obterEstatisticas();

      // Assert
      expect(solicitacaoRepository.contarPorTipo).toHaveBeenCalledWith('LOJISTA');
      expect(solicitacaoRepository.contarPorTipo).toHaveBeenCalledWith('ENTREGADOR');
      expect(result).toEqual({
        totalLojistas: expectedLojistas,
        totalEntregadores: expectedEntregadores,
        total: expectedLojistas + expectedEntregadores
      });
    });
  });
});