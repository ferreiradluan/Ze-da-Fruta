import { Injectable, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { SolicitacaoParceiro } from '../../domain/entities/solicitacao-parceiro.entity';
import { SolicitacaoParceiroRepository } from '../../infrastructure/repositories/solicitacao-parceiro.repository';
import { SolicitacaoLojistaDto } from '../../api/dto/solicitacao-lojista.dto';
import { SolicitacaoEntregadorDto } from '../../api/dto/solicitacao-entregador.dto';
import { SolicitacaoRecebidaEvent } from '../../domain/events/solicitacao-recebida.event';
import { EventBusService } from '../../../common/event-bus';
import { TIPO_SOLICITACAO } from '../../domain/types/tipo-solicitacao.types';
import { STATUS_SOLICITACAO } from '../../domain/types/status-solicitacao.types';

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
      await this.validarDuplicidade(dados.email);

      // Criar entidade de solicitação simplificada
      const solicitacao = this.solicitacaoRepository.create({
        email: dados.email,
        tipo: TIPO_SOLICITACAO.LOJISTA,
        status: 'PENDENTE',
        dados: dados // Armazenar todos os dados como JSON
      });

      // Salvar solicitação
      const solicitacaoSalva = await this.solicitacaoRepository.save(solicitacao);      // Disparar evento
      const evento: SolicitacaoRecebidaEvent = {
        solicitacaoId: solicitacaoSalva.id || '',
        tipo: TIPO_SOLICITACAO.LOJISTA,
        nome: dados.nome,
        email: dados.email,
        telefone: dados.telefone,
        cpf: dados.cpf,
        timestamp: new Date(),
        dadosEspecificos: dados,
        endereco: {
          endereco: dados.endereco,
          numeroEndereco: dados.numeroEndereco,
          complemento: dados.complemento,
          bairro: dados.bairro,
          cidade: dados.cidade,
          estado: dados.estado,
          cep: dados.cep,
        },
      };

      this.eventBusService.publish('solicitacao.recebida', evento);

      this.logger.log(`✅ Solicitação de lojista criada: ${solicitacaoSalva.id}`);
      return solicitacaoSalva;    } catch (err: any) {
      this.logger.error('Erro ao criar solicitação de lojista', err);
      throw new BadRequestException('Erro ao processar solicitação: ' + (err?.message || String(err)));
    }
  }

  /**
   * Cria uma solicitação de parceria para entregador
   */
  async criarSolicitacaoEntregador(dados: SolicitacaoEntregadorDto): Promise<SolicitacaoParceiro> {
    try {
      this.logger.log(`🛵 Recebendo solicitação de entregador: ${dados.email}`);

      // Validar duplicidade
      await this.validarDuplicidade(dados.email);

      // Criar entidade de solicitação simplificada
      const solicitacao = this.solicitacaoRepository.create({
        email: dados.email,
        tipo: 'ENTREGADOR',
        status: 'PENDENTE',
        dados: dados // Armazenar todos os dados como JSON
      });

      // Salvar solicitação
      const solicitacaoSalva = await this.solicitacaoRepository.save(solicitacao);      // Disparar evento
      const evento: SolicitacaoRecebidaEvent = {
        solicitacaoId: solicitacaoSalva.id || '',
        tipo: TIPO_SOLICITACAO.ENTREGADOR,
        nome: dados.nome,
        email: dados.email,
        telefone: dados.telefone,
        cpf: dados.cpf,
        timestamp: new Date(),
        dadosEspecificos: dados,
        endereco: {
          endereco: dados.endereco || '',
          numeroEndereco: dados.numeroEndereco || '',
          bairro: dados.bairro || '',
          cidade: dados.cidade || '',
          estado: dados.estado || '',
          cep: dados.cep || '',
        },
      };

      this.eventBusService.publish('solicitacao.recebida', evento);

      this.logger.log(`✅ Solicitação de entregador criada: ${solicitacaoSalva.id}`);
      return solicitacaoSalva;    } catch (err: any) {
      this.logger.error('Erro ao criar solicitação de entregador', err);
      throw new BadRequestException('Erro ao processar solicitação: ' + (err?.message || String(err)));
    }
  }

  private async validarDuplicidade(email: string): Promise<void> {
    const solicitacaoExistente = await this.solicitacaoRepository.findOne({ 
      where: { email } 
    });
    
    if (solicitacaoExistente) {
      throw new ConflictException('Já existe uma solicitação com este e-mail');
    }
  }

  /**
   * Busca solicitações por status
   */
  async buscarSolicitacoesPorStatus(status: string): Promise<SolicitacaoParceiro[]> {
    return this.solicitacaoRepository.buscarPorStatus(status);
  }

  /**
   * Busca estatísticas de solicitações
   */  async obterEstatisticas(): Promise<any> {
    const [totalLojistas, totalEntregadores] = await Promise.all([
      this.solicitacaoRepository.contarPorTipo(TIPO_SOLICITACAO.LOJISTA),
      this.solicitacaoRepository.contarPorTipo(TIPO_SOLICITACAO.ENTREGADOR),
    ]);

    return {
      totalLojistas,
      totalEntregadores,
      total: totalLojistas + totalEntregadores
    };
  }
}
