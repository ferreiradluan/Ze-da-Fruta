import { Injectable, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { SolicitacaoParceiro } from '../../domain/entities/solicitacao-parceiro.entity';
import { SolicitacaoParceiroRepository } from '../../infrastructure/repositories/solicitacao-parceiro.repository';
import { SolicitacaoLojistaDto } from '../../api/dto/solicitacao-lojista.dto';
import { SolicitacaoEntregadorDto } from '../../api/dto/solicitacao-entregador.dto';
import { SolicitacaoRecebidaEvent } from '../../domain/events/solicitacao-recebida.event';
import { TipoSolicitacao } from '../../domain/enums/tipo-solicitacao.enum';
import { EventBusService } from '../../../common/event-bus';

@Injectable()
export class PartnerOnboardingService {
  private readonly logger = new Logger(PartnerOnboardingService.name);

  constructor(
    private readonly solicitacaoRepository: SolicitacaoParceiroRepository,
    private readonly eventBusService: EventBusService,
  ) {}

  /**
   * Cria uma solicitação de parceria para lojista
   */
  async criarSolicitacaoLojista(dados: SolicitacaoLojistaDto): Promise<SolicitacaoParceiro> {
    try {
      this.logger.log(`🏪 Recebendo solicitação de lojista: ${dados.email}`);

      // Validar duplicidade
      await this.validarDuplicidade(dados.email, dados.cpf, dados.cnpj);

      // Criar entidade de solicitação
      const solicitacao = SolicitacaoParceiro.criarSolicitacaoLojista({
        nome: dados.nome,
        email: dados.email.toLowerCase(),
        telefone: dados.telefone,
        cpf: dados.cpf,
        nomeEstabelecimento: dados.nomeEstabelecimento,
        cnpj: dados.cnpj,
        descricaoNegocio: dados.descricaoNegocio,
        endereco: dados.endereco,
        numeroEndereco: dados.numeroEndereco,
        complemento: dados.complemento,
        bairro: dados.bairro,
        cidade: dados.cidade,
        estado: dados.estado.toUpperCase(),
        cep: dados.cep,
        observacoes: dados.observacoes
      });

      // Salvar no banco
      const solicitacaoSalva = await this.solicitacaoRepository.criar(solicitacao);

      this.logger.log(`✅ Solicitação de lojista criada: ${solicitacaoSalva.id}`);

      // Emitir evento
      await this.emitirEventoSolicitacaoRecebida(solicitacaoSalva);

      return solicitacaoSalva;

    } catch (error) {
      this.logger.error(`❌ Erro ao criar solicitação de lojista:`, error);
      
      if (error instanceof BadRequestException || error instanceof ConflictException) {
        throw error;
      }
      
      throw new BadRequestException('Erro interno ao processar solicitação');
    }
  }

  /**
   * Cria uma solicitação de parceria para entregador
   */
  async criarSolicitacaoEntregador(dados: SolicitacaoEntregadorDto): Promise<SolicitacaoParceiro> {
    try {
      this.logger.log(`🚚 Recebendo solicitação de entregador: ${dados.email}`);

      // Validar duplicidade
      await this.validarDuplicidade(dados.email, dados.cpf);

      // Criar entidade de solicitação
      const solicitacao = SolicitacaoParceiro.criarSolicitacaoEntregador({
        nome: dados.nome,
        email: dados.email.toLowerCase(),
        telefone: dados.telefone,
        cpf: dados.cpf,
        tipoVeiculo: dados.tipoVeiculo,
        modeloVeiculo: dados.modeloVeiculo,
        placaVeiculo: dados.placaVeiculo.toUpperCase(),
        numeroCNH: dados.numeroCNH,
        endereco: dados.endereco,
        numeroEndereco: dados.numeroEndereco,
        complemento: dados.complemento,
        bairro: dados.bairro,
        cidade: dados.cidade,
        estado: dados.estado.toUpperCase(),
        cep: dados.cep,
        observacoes: dados.observacoes
      });

      // Salvar no banco
      const solicitacaoSalva = await this.solicitacaoRepository.criar(solicitacao);

      this.logger.log(`✅ Solicitação de entregador criada: ${solicitacaoSalva.id}`);

      // Emitir evento
      await this.emitirEventoSolicitacaoRecebida(solicitacaoSalva);

      return solicitacaoSalva;

    } catch (error) {
      this.logger.error(`❌ Erro ao criar solicitação de entregador:`, error);
      
      if (error instanceof BadRequestException || error instanceof ConflictException) {
        throw error;
      }
      
      throw new BadRequestException('Erro interno ao processar solicitação');
    }
  }

  /**
   * Valida se já existe solicitação com os mesmos dados
   */
  private async validarDuplicidade(email: string, cpf: string, cnpj?: string): Promise<void> {
    // Verificar por email
    const solicitacaoExistenteEmail = await this.solicitacaoRepository.buscarPorEmail(email.toLowerCase());
    if (solicitacaoExistenteEmail) {
      throw new ConflictException('Já existe uma solicitação com este e-mail');
    }

    // Verificar por CPF
    const solicitacaoExistenteCpf = await this.solicitacaoRepository.buscarPorCpf(cpf);
    if (solicitacaoExistenteCpf) {
      throw new ConflictException('Já existe uma solicitação com este CPF');
    }

    // Verificar por CNPJ (se fornecido)
    if (cnpj) {
      const solicitacaoExistenteCnpj = await this.solicitacaoRepository.buscarPorCnpj(cnpj);
      if (solicitacaoExistenteCnpj) {
        throw new ConflictException('Já existe uma solicitação com este CNPJ');
      }
    }
  }

  /**
   * Emite evento de solicitação recebida
   */
  private async emitirEventoSolicitacaoRecebida(solicitacao: SolicitacaoParceiro): Promise<void> {
    try {
      const evento: SolicitacaoRecebidaEvent = {
        solicitacaoId: solicitacao.id,
        tipo: solicitacao.tipo,
        nome: solicitacao.nome,
        email: solicitacao.email,
        telefone: solicitacao.telefone,
        cpf: solicitacao.cpf,
        timestamp: new Date(),
        dadosEspecificos: {
          // Dados para lojista
          nomeEstabelecimento: solicitacao.nomeEstabelecimento,
          cnpj: solicitacao.cnpj,
          descricaoNegocio: solicitacao.descricaoNegocio,
          // Dados para entregador
          tipoVeiculo: solicitacao.tipoVeiculo,
          modeloVeiculo: solicitacao.modeloVeiculo,
          placaVeiculo: solicitacao.placaVeiculo,
          numeroCNH: solicitacao.numeroCNH
        },
        endereco: {
          endereco: solicitacao.endereco,
          numeroEndereco: solicitacao.numeroEndereco,
          complemento: solicitacao.complemento,
          bairro: solicitacao.bairro,
          cidade: solicitacao.cidade,
          estado: solicitacao.estado,
          cep: solicitacao.cep
        }
      };

      await this.eventBusService.emit({
        eventName: 'solicitacao.recebida',
        payload: evento,
        timestamp: new Date(),
        aggregateId: solicitacao.id
      });

      this.logger.log(`📢 Evento 'solicitacao.recebida' emitido para solicitação ${solicitacao.id}`);

    } catch (error) {
      this.logger.error(`❌ Erro ao emitir evento para solicitação ${solicitacao.id}:`, error);
      // Não propagar o erro para não falhar a criação da solicitação
    }
  }

  /**
   * Busca solicitação por ID (método auxiliar para outros serviços)
   */
  async buscarSolicitacaoPorId(id: string): Promise<SolicitacaoParceiro | null> {
    return this.solicitacaoRepository.buscarPorId(id);
  }

  /**
   * Lista estatísticas básicas de solicitações (método auxiliar)
   */
  async obterEstatisticas(): Promise<{
    total: number;
    lojistas: number;
    entregadores: number;
    pendentes: number;
  }> {
    const [total, lojistas, entregadores, pendentes] = await Promise.all([
      this.solicitacaoRepository.contar(),
      this.solicitacaoRepository.contarPorTipo(TipoSolicitacao.LOJISTA),
      this.solicitacaoRepository.contarPorTipo(TipoSolicitacao.ENTREGADOR),
      this.solicitacaoRepository.contarPorStatus('PENDENTE' as any)
    ]);

    return {
      total,
      lojistas,
      entregadores,
      pendentes
    };
  }
}
