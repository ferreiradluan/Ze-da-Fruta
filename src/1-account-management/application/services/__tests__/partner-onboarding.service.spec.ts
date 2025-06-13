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

  beforeEach(async () => {
    const mockRepository = {
      criar: jest.fn(),
      buscarPorEmail: jest.fn(),
      buscarPorCpf: jest.fn(),
      buscarPorCnpj: jest.fn(),
      buscarPorId: jest.fn(),
      contar: jest.fn(),
      contarPorTipo: jest.fn(),
      contarPorStatus: jest.fn(),
    };

    const mockEventBusService = {
      emit: jest.fn().mockResolvedValue(undefined),
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
    it('should create a store partner request successfully', async () => {
      // Arrange
      const mockSolicitacao = new SolicitacaoParceiro();
      Object.assign(mockSolicitacao, {
        id: 'solicitacao-1',
        tipo: 'LOJISTA', // String ao invés de enum
        status: 'PENDENTE', // String ao invés de enum
        nome: mockSolicitacaoLojistaDto.nome,
        email: mockSolicitacaoLojistaDto.email,
        telefone: mockSolicitacaoLojistaDto.telefone,
        cpf: mockSolicitacaoLojistaDto.cpf,
        nomeEstabelecimento: mockSolicitacaoLojistaDto.nomeEstabelecimento,
        cnpj: mockSolicitacaoLojistaDto.cnpj,
        descricaoNegocio: mockSolicitacaoLojistaDto.descricaoNegocio,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      solicitacaoRepository.buscarPorEmail.mockResolvedValue(null);
      solicitacaoRepository.buscarPorCpf.mockResolvedValue(null);
      solicitacaoRepository.buscarPorCnpj.mockResolvedValue(null);
      solicitacaoRepository.criar.mockResolvedValue(mockSolicitacao);
      eventBusService.emit.mockResolvedValue();

      // Act
      const result = await service.criarSolicitacaoLojista(mockSolicitacaoLojistaDto);

      // Assert
      expect(solicitacaoRepository.buscarPorEmail).toHaveBeenCalledWith(mockSolicitacaoLojistaDto.email.toLowerCase());
      expect(solicitacaoRepository.buscarPorCpf).toHaveBeenCalledWith(mockSolicitacaoLojistaDto.cpf);
      expect(solicitacaoRepository.buscarPorCnpj).toHaveBeenCalledWith(mockSolicitacaoLojistaDto.cnpj);
      expect(solicitacaoRepository.criar).toHaveBeenCalled();
      expect(eventBusService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          eventName: 'solicitacao.recebida',
          payload: expect.objectContaining({
            solicitacaoId: mockSolicitacao.id,
            tipo: 'LOJISTA', // String ao invés de enum
            nome: mockSolicitacao.nome,
            email: mockSolicitacao.email,
            telefone: mockSolicitacao.telefone,
            cpf: mockSolicitacao.cpf,
            timestamp: expect.any(Date)
          }),
          timestamp: expect.any(Date),
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
      const expectedTotal = 100;
      const expectedLojistas = 70;
      const expectedEntregadores = 30;
      const expectedPendentes = 25;

      solicitacaoRepository.contar.mockResolvedValue(expectedTotal);
      solicitacaoRepository.contarPorTipo.mockImplementation((tipo) => {
        if (tipo === 'LOJISTA') return Promise.resolve(expectedLojistas);
        if (tipo === 'ENTREGADOR') return Promise.resolve(expectedEntregadores);
        return Promise.resolve(0);
      });
      solicitacaoRepository.contarPorStatus.mockResolvedValue(expectedPendentes);

      // Act
      const result = await service.obterEstatisticas();

      // Assert
      expect(solicitacaoRepository.contar).toHaveBeenCalled();
      expect(solicitacaoRepository.contarPorTipo).toHaveBeenCalledWith('LOJISTA');
      expect(solicitacaoRepository.contarPorTipo).toHaveBeenCalledWith('ENTREGADOR');
      expect(solicitacaoRepository.contarPorStatus).toHaveBeenCalledWith('PENDENTE');
      expect(result).toEqual({
        total: expectedTotal,
        lojistas: expectedLojistas,
        entregadores: expectedEntregadores,
        pendentes: expectedPendentes
      });
    });
  });
});