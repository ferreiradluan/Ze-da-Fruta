import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { PartnerOnboardingService } from '../partner-onboarding.service';
import { SolicitacaoParceiroRepository } from '../../../infrastructure/repositories/solicitacao-parceiro.repository';
import { EventBusService } from '../../../../common/event-bus/event-bus.service';
import { SolicitacaoLojistaDto } from '../../../api/dto/solicitacao-lojista.dto';
import { SolicitacaoEntregadorDto } from '../../../api/dto/solicitacao-entregador.dto';
import { SolicitacaoParceiro } from '../../../domain/entities/solicitacao-parceiro.entity';
import { TipoSolicitacao } from '../../../domain/enums/tipo-solicitacao.enum';
import { StatusSolicitacao } from '../../../domain/enums/status-solicitacao.enum';

describe('PartnerOnboardingService', () => {
  let service: PartnerOnboardingService;
  let solicitacaoRepository: jest.Mocked<SolicitacaoParceiroRepository>;
  let eventBusService: jest.Mocked<EventBusService>;

  const mockSolicitacaoLojistaDto: SolicitacaoLojistaDto = {
    nome: 'João Silva',
    email: 'joao@loja.com',
    telefone: '11987654321',
    cpf: '12345678901',
    nomeEstabelecimento: 'Loja do João',
    cnpj: '12345678901234',
    descricaoNegocio: 'Loja de produtos variados',
    endereco: 'Rua das Flores',
    numeroEndereco: '123',
    complemento: 'Sala 1',
    bairro: 'Centro',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01234567'
  };

  const mockSolicitacaoEntregadorDto: SolicitacaoEntregadorDto = {
    nome: 'Carlos Santos',
    email: 'carlos@entregador.com',
    telefone: '11987654322',
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('criarSolicitacaoLojista', () => {
    it('should create a store partner request successfully', async () => {
      // Arrange
      const mockSolicitacao = new SolicitacaoParceiro();
      Object.assign(mockSolicitacao, {
        id: 'solicitacao-1',
        tipo: TipoSolicitacao.LOJISTA,
        status: StatusSolicitacao.PENDENTE,
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
            tipo: TipoSolicitacao.LOJISTA,
            nome: mockSolicitacao.nome,
            email: mockSolicitacao.email,
            telefone: mockSolicitacao.telefone,
            cpf: mockSolicitacao.cpf,
            timestamp: expect.any(Date)
          }),
          timestamp: expect.any(Date),
          aggregateId: mockSolicitacao.id
        })
      );
      expect(result).toEqual(mockSolicitacao);
    });

    it('should throw ConflictException when email already exists', async () => {
      // Arrange
      const existingSolicitacao = new SolicitacaoParceiro();
      solicitacaoRepository.buscarPorEmail.mockResolvedValue(existingSolicitacao);

      // Act & Assert
      await expect(service.criarSolicitacaoLojista(mockSolicitacaoLojistaDto))
        .rejects.toThrow(ConflictException);
      expect(solicitacaoRepository.buscarPorEmail).toHaveBeenCalledWith(mockSolicitacaoLojistaDto.email.toLowerCase());
      expect(solicitacaoRepository.criar).not.toHaveBeenCalled();
      expect(eventBusService.emit).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when CPF already exists', async () => {
      // Arrange
      const existingSolicitacao = new SolicitacaoParceiro();
      solicitacaoRepository.buscarPorEmail.mockResolvedValue(null);
      solicitacaoRepository.buscarPorCpf.mockResolvedValue(existingSolicitacao);

      // Act & Assert
      await expect(service.criarSolicitacaoLojista(mockSolicitacaoLojistaDto))
        .rejects.toThrow(ConflictException);
      expect(solicitacaoRepository.buscarPorCpf).toHaveBeenCalledWith(mockSolicitacaoLojistaDto.cpf);
      expect(solicitacaoRepository.criar).not.toHaveBeenCalled();
      expect(eventBusService.emit).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when CNPJ already exists', async () => {
      // Arrange
      const existingSolicitacao = new SolicitacaoParceiro();
      solicitacaoRepository.buscarPorEmail.mockResolvedValue(null);
      solicitacaoRepository.buscarPorCpf.mockResolvedValue(null);
      solicitacaoRepository.buscarPorCnpj.mockResolvedValue(existingSolicitacao);

      // Act & Assert
      await expect(service.criarSolicitacaoLojista(mockSolicitacaoLojistaDto))
        .rejects.toThrow(ConflictException);
      expect(solicitacaoRepository.buscarPorCnpj).toHaveBeenCalledWith(mockSolicitacaoLojistaDto.cnpj);
      expect(solicitacaoRepository.criar).not.toHaveBeenCalled();
      expect(eventBusService.emit).not.toHaveBeenCalled();
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const errorMessage = 'Database connection failed';
      solicitacaoRepository.buscarPorEmail.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(service.criarSolicitacaoLojista(mockSolicitacaoLojistaDto))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('criarSolicitacaoEntregador', () => {
    it('should create a delivery partner request successfully', async () => {
      // Arrange
      const mockSolicitacao = new SolicitacaoParceiro();
      Object.assign(mockSolicitacao, {
        id: 'solicitacao-2',
        tipo: TipoSolicitacao.ENTREGADOR,
        status: StatusSolicitacao.PENDENTE,
        nome: mockSolicitacaoEntregadorDto.nome,
        email: mockSolicitacaoEntregadorDto.email,
        telefone: mockSolicitacaoEntregadorDto.telefone,
        cpf: mockSolicitacaoEntregadorDto.cpf,
        tipoVeiculo: mockSolicitacaoEntregadorDto.tipoVeiculo,
        numeroCNH: mockSolicitacaoEntregadorDto.numeroCNH,
        placaVeiculo: mockSolicitacaoEntregadorDto.placaVeiculo,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      solicitacaoRepository.buscarPorEmail.mockResolvedValue(null);
      solicitacaoRepository.buscarPorCpf.mockResolvedValue(null);
      solicitacaoRepository.criar.mockResolvedValue(mockSolicitacao);
      eventBusService.emit.mockResolvedValue();

      // Act
      const result = await service.criarSolicitacaoEntregador(mockSolicitacaoEntregadorDto);

      // Assert
      expect(solicitacaoRepository.buscarPorEmail).toHaveBeenCalledWith(mockSolicitacaoEntregadorDto.email.toLowerCase());
      expect(solicitacaoRepository.buscarPorCpf).toHaveBeenCalledWith(mockSolicitacaoEntregadorDto.cpf);
      expect(solicitacaoRepository.criar).toHaveBeenCalled();
      expect(eventBusService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          eventName: 'solicitacao.recebida',
          payload: expect.objectContaining({
            solicitacaoId: mockSolicitacao.id,
            tipo: TipoSolicitacao.ENTREGADOR,
            nome: mockSolicitacao.nome,
            email: mockSolicitacao.email,
            telefone: mockSolicitacao.telefone,
            cpf: mockSolicitacao.cpf,
            timestamp: expect.any(Date)
          }),
          timestamp: expect.any(Date),
          aggregateId: mockSolicitacao.id
        })
      );
      expect(result).toEqual(mockSolicitacao);
    });

    it('should throw ConflictException when email already exists', async () => {
      // Arrange
      const existingSolicitacao = new SolicitacaoParceiro();
      solicitacaoRepository.buscarPorEmail.mockResolvedValue(existingSolicitacao);

      // Act & Assert
      await expect(service.criarSolicitacaoEntregador(mockSolicitacaoEntregadorDto))
        .rejects.toThrow(ConflictException);
      expect(solicitacaoRepository.buscarPorEmail).toHaveBeenCalledWith(mockSolicitacaoEntregadorDto.email.toLowerCase());
      expect(solicitacaoRepository.criar).not.toHaveBeenCalled();
      expect(eventBusService.emit).not.toHaveBeenCalled();
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const errorMessage = 'Database connection failed';
      solicitacaoRepository.buscarPorEmail.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(service.criarSolicitacaoEntregador(mockSolicitacaoEntregadorDto))
        .rejects.toThrow(BadRequestException);
    });
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
        if (tipo === TipoSolicitacao.LOJISTA) return Promise.resolve(expectedLojistas);
        if (tipo === TipoSolicitacao.ENTREGADOR) return Promise.resolve(expectedEntregadores);
        return Promise.resolve(0);
      });
      solicitacaoRepository.contarPorStatus.mockResolvedValue(expectedPendentes);

      // Act
      const result = await service.obterEstatisticas();

      // Assert
      expect(solicitacaoRepository.contar).toHaveBeenCalled();
      expect(solicitacaoRepository.contarPorTipo).toHaveBeenCalledWith(TipoSolicitacao.LOJISTA);
      expect(solicitacaoRepository.contarPorTipo).toHaveBeenCalledWith(TipoSolicitacao.ENTREGADOR);
      expect(solicitacaoRepository.contarPorStatus).toHaveBeenCalledWith('PENDENTE');
      expect(result).toEqual({
        total: expectedTotal,
        lojistas: expectedLojistas,
        entregadores: expectedEntregadores,
        pendentes: expectedPendentes
      });
    });

    it('should handle repository errors in statistics', async () => {
      // Arrange
      const errorMessage = 'Database error';
      solicitacaoRepository.contar.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(service.obterEstatisticas())
        .rejects.toThrow(Error);
    });
  });
});