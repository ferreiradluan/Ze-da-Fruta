import { Injectable, Inject } from '@nestjs/common';
import { Entrega } from '../entities/entrega.entity';
import { Entregador, StatusEntregador, StatusDisponibilidade } from '../entities/entregador.entity';
import { EnderecoVO } from '../value-objects/endereco.vo';
import { StatusEntrega } from '../enums/status-entrega.enum';
import { 
  EntregaNaoEncontradaError,
  EntregadorNaoEncontradoError,
  EntregadorIndisponivelError,
  EntregadorInativoError,
  EntregaSemEntregadorError
} from '../errors/index';
import { IEntregaRepository } from '../repositories/entrega.repository.interface';
import { IEntregadorRepository } from '../repositories/entregador.repository.interface';

// Import tokens from module
export const ENTREGA_REPOSITORY_TOKEN = 'IEntregaRepository';
export const ENTREGADOR_REPOSITORY_TOKEN = 'IEntregadorRepository';

/**
 * Serviço de domínio para operações complexas de entregas
 * que envolvem múltiplas entidades e regras de negócio
 */
@Injectable()
export class EntregaDomainService {
  constructor(
    @Inject(ENTREGA_REPOSITORY_TOKEN)
    private readonly entregaRepository: IEntregaRepository,
    @Inject(ENTREGADOR_REPOSITORY_TOKEN)
    private readonly entregadorRepository: IEntregadorRepository,
  ) {}
  /**
   * Busca o melhor entregador para uma entrega
   */
  async buscarMelhorEntregador(entrega: Entrega): Promise<Entregador | null> {
    if (!entrega.enderecoColeta) {
      // Se não há endereço de coleta, buscar qualquer disponível
      const entregadoresDisponiveis = await this.entregadorRepository.buscarDisponiveis();
      return entregadoresDisponiveis.length > 0 ? this.selecionarMelhorEntregador(entregadoresDisponiveis) : null;
    }

    // Buscar entregadores disponíveis próximos ao endereço de coleta
    const entregadoresProximos = await this.entregadorRepository
      .buscarProximosAoEndereco(entrega.enderecoColeta, 10); // 10km de raio

    if (entregadoresProximos.length === 0) {
      // Se não há próximos, buscar qualquer disponível
      const entregadoresDisponiveis = await this.entregadorRepository.buscarDisponiveis();
      if (entregadoresDisponiveis.length === 0) {
        return null;
      }
      return this.selecionarMelhorEntregador(entregadoresDisponiveis);
    }

    return this.selecionarMelhorEntregador(entregadoresProximos);
  }

  /**
   * Seleciona o melhor entregador baseado em critérios de negócio
   */
  private selecionarMelhorEntregador(entregadores: Entregador[]): Entregador {
    return entregadores
      .filter(e => e.estaDisponivel())
      .sort((a, b) => {
        // Priorizar por:
        // 1. Avaliação mais alta
        if (b.avaliacaoMedia !== a.avaliacaoMedia) {
          return b.avaliacaoMedia - a.avaliacaoMedia;
        }
        
        // 2. Menor taxa de cancelamento
        const taxaCancelamentoA = a.calcularTaxaCancelamento();
        const taxaCancelamentoB = b.calcularTaxaCancelamento();
        if (taxaCancelamentoA !== taxaCancelamentoB) {
          return taxaCancelamentoA - taxaCancelamentoB;
        }
        
        // 3. Mais experiência (total de entregas)
        return b.totalEntregasCompletas - a.totalEntregasCompletas;
      })[0];
  }

  /**
   * Atribui entregador à entrega automaticamente
   */
  async atribuirEntregadorAutomaticamente(entregaId: string): Promise<boolean> {
    const entrega = await this.entregaRepository.buscarPorId(entregaId);
    if (!entrega) {
      throw new EntregaNaoEncontradaError(entregaId);
    }

    if (!entrega.podeSerAceita()) {
      return false; // Entrega não está disponível para aceite
    }

    const melhorEntregador = await this.buscarMelhorEntregador(entrega);
    if (!melhorEntregador) {
      return false; // Nenhum entregador disponível
    }

    // Aceitar entrega
    entrega.aceitar(melhorEntregador.id);
    melhorEntregador.iniciarEntrega();

    await this.entregaRepository.salvar(entrega);
    await this.entregadorRepository.salvar(melhorEntregador);

    return true;
  }

  /**
   * Permite que entregador aceite entrega manualmente
   */
  async aceitarEntrega(entregaId: string, entregadorId: string): Promise<void> {
    const entrega = await this.entregaRepository.buscarPorId(entregaId);
    if (!entrega) {
      throw new EntregaNaoEncontradaError(entregaId);
    }

    const entregador = await this.entregadorRepository.buscarPorId(entregadorId);
    if (!entregador) {
      throw new EntregadorNaoEncontradoError(entregadorId);
    }

    if (!entregador.estaDisponivel()) {
      throw new EntregadorIndisponivelError(entregadorId, entregador.disponibilidade);
    }

    // Aceitar entrega
    entrega.aceitar(entregadorId);
    entregador.iniciarEntrega();

    await this.entregaRepository.salvar(entrega);
    await this.entregadorRepository.salvar(entregador);
  }

  /**
   * Inicia processo de entrega (retirada)
   */
  async iniciarEntrega(entregaId: string, entregadorId: string): Promise<void> {
    const entrega = await this.entregaRepository.buscarPorId(entregaId);
    if (!entrega) {
      throw new EntregaNaoEncontradaError(entregaId);
    }

    const entregador = await this.entregadorRepository.buscarPorId(entregadorId);
    if (!entregador) {
      throw new EntregadorNaoEncontradoError(entregadorId);
    }

    if (entrega.entregadorId !== entregadorId) {
      throw new EntregaSemEntregadorError();
    }

    // Confirmar retirada
    entrega.confirmarRetirada();

    await this.entregaRepository.salvar(entrega);
  }

  /**
   * Finaliza entrega com sucesso
   */
  async finalizarEntrega(entregaId: string, entregadorId: string): Promise<void> {
    const entrega = await this.entregaRepository.buscarPorId(entregaId);
    if (!entrega) {
      throw new EntregaNaoEncontradaError(entregaId);
    }

    const entregador = await this.entregadorRepository.buscarPorId(entregadorId);
    if (!entregador) {
      throw new EntregadorNaoEncontradoError(entregadorId);
    }

    if (entrega.entregadorId !== entregadorId) {
      throw new EntregaSemEntregadorError();
    }    // Confirmar entrega
    entrega.confirmarEntrega();
    entregador.finalizarEntrega(false);

    // Calcular distância percorrida (simplificado)
    if (entrega.enderecoColeta && entrega.enderecoEntrega) {
      const distancia = entrega.enderecoColeta.calcularDistancia(entrega.enderecoEntrega);
      entregador.adicionarDistanciaPercorrida(distancia);
    }

    await this.entregaRepository.salvar(entrega);
    await this.entregadorRepository.salvar(entregador);
  }

  /**
   * Cancela entrega
   */
  async cancelarEntrega(entregaId: string, motivo: string, entregadorId?: string): Promise<void> {
    const entrega = await this.entregaRepository.buscarPorId(entregaId);
    if (!entrega) {
      throw new EntregaNaoEncontradaError(entregaId);
    }

    let entregador: Entregador | null = null;
    if (entrega.entregadorId) {
      entregador = await this.entregadorRepository.buscarPorId(entrega.entregadorId);
    }

    // Cancelar entrega
    entrega.cancelar(motivo);

    // Se tinha entregador, liberar disponibilidade
    if (entregador) {
      entregador.finalizarEntrega(true); // true = foi cancelada
    }

    await this.entregaRepository.salvar(entrega);
    if (entregador) {
      await this.entregadorRepository.salvar(entregador);
    }
  }

  /**
   * Redistribui entrega para outro entregador
   */
  async redistribuirEntrega(entregaId: string, novoEntregadorId?: string): Promise<boolean> {
    const entrega = await this.entregaRepository.buscarPorId(entregaId);
    if (!entrega) {
      throw new EntregaNaoEncontradaError(entregaId);
    }

    // Liberar entregador atual se houver
    if (entrega.entregadorId) {
      const entregadorAtual = await this.entregadorRepository.buscarPorId(entrega.entregadorId);
      if (entregadorAtual) {
        entregadorAtual.finalizarEntrega(true); // Liberar disponibilidade
        await this.entregadorRepository.salvar(entregadorAtual);
      }
    }

    // Resetar status da entrega
    entrega.entregadorId = null;
    entrega.status = StatusEntrega.AGUARDANDO_ACEITE;

    let novoEntregador: Entregador | null = null;    if (novoEntregadorId) {
      // Entregador específico foi solicitado
      novoEntregador = await this.entregadorRepository.buscarPorId(novoEntregadorId);
      if (!novoEntregador || !novoEntregador.estaDisponivel()) {
        throw new EntregadorIndisponivelError(
          novoEntregadorId, 
          novoEntregador?.disponibilidade || StatusDisponibilidade.INDISPONIVEL
        );
      }
    } else {
      // Buscar automaticamente
      novoEntregador = await this.buscarMelhorEntregador(entrega);
    }

    if (novoEntregador) {
      entrega.aceitar(novoEntregador.id);
      novoEntregador.iniciarEntrega();
      await this.entregadorRepository.salvar(novoEntregador);
    }

    await this.entregaRepository.salvar(entrega);
    return novoEntregador !== null;
  }

  /**
   * Calcula estimativa de tempo de entrega
   */
  calcularEstimativaEntrega(enderecoColeta: EnderecoVO, enderecoEntrega: EnderecoVO): {
    tempoEstimado: number; // em minutos
    distancia: number; // em km
    valorFreteEstimado: number; // em reais
  } {
    const distancia = enderecoColeta.calcularDistancia(enderecoEntrega);
    
    // Velocidade média urbana: 25 km/h
    const tempoViagem = (distancia / 25) * 60; // em minutos
    const tempoPreparacao = 15; // 15 minutos para preparação
    const tempoEstimado = Math.ceil(tempoViagem + tempoPreparacao);
    
    // Cálculo do frete: R$ 2,00 base + R$ 1,50 por km
    const valorFreteEstimado = Math.round((2.00 + (distancia * 1.50)) * 100) / 100;
    
    return {
      tempoEstimado,
      distancia: Math.round(distancia * 100) / 100,
      valorFreteEstimado
    };
  }

  /**
   * Verifica entregas atrasadas e notifica
   */
  async verificarEntregasAtrasadas(): Promise<Entrega[]> {
    const entregasEmAndamento = await this.entregaRepository.buscarPorStatus(StatusEntrega.EM_ROTA);
    
    return entregasEmAndamento.filter(entrega => entrega.estaAtrasada());
  }

  /**
   * Avalia entregador após entrega concluída
   */
  async avaliarEntregador(entregadorId: string, avaliacao: number): Promise<void> {
    const entregador = await this.entregadorRepository.buscarPorId(entregadorId);
    if (!entregador) {
      throw new EntregadorNaoEncontradoError(entregadorId);
    }

    entregador.adicionarAvaliacao(avaliacao);
    await this.entregadorRepository.salvar(entregador);
  }

  /**
   * Atualiza localização do entregador
   */
  async atualizarLocalizacaoEntregador(
    entregadorId: string, 
    latitude: number, 
    longitude: number
  ): Promise<void> {
    const entregador = await this.entregadorRepository.buscarPorId(entregadorId);
    if (!entregador) {
      throw new EntregadorNaoEncontradoError(entregadorId);
    }

    entregador.atualizarLocalizacao(latitude, longitude);
    await this.entregadorRepository.salvar(entregador);
  }

  /**
   * Verifica se entregador pode ser desativado
   */
  async podeDesativarEntregador(entregadorId: string): Promise<boolean> {
    const entregasAtivas = await this.entregaRepository.buscarEntregasAtivasPorEntregador(entregadorId);
    return entregasAtivas.length === 0;
  }

  /**
   * Desativa entregador se possível
   */
  async desativarEntregador(entregadorId: string): Promise<void> {
    const entregador = await this.entregadorRepository.buscarPorId(entregadorId);
    if (!entregador) {
      throw new EntregadorNaoEncontradoError(entregadorId);
    }

    const podeDesativar = await this.podeDesativarEntregador(entregadorId);
    entregador.desativar(!podeDesativar);

    await this.entregadorRepository.salvar(entregador);
  }
}
