import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { SolicitacaoParceiro } from '../../../1-account-management/domain/entities/solicitacao-parceiro.entity';
import { SolicitacaoParceiroRepository } from '../../../1-account-management/infrastructure/repositories/solicitacao-parceiro.repository';
import { StatusSolicitacao } from '../../../1-account-management/domain/enums/status-solicitacao.enum';
import { TipoSolicitacao } from '../../../1-account-management/domain/enums/tipo-solicitacao.enum';
import { AccountService } from '../../../1-account-management/application/services/account.service';
import { SalesService } from '../../../2-sales/application/services/sales.service';
import { PaymentService } from '../../../4-payment/application/services/payment.service';
import { StatusPedido } from '../../../2-sales/domain/enums/status-pedido.enum';
import { StatusUsuario } from '../../../1-account-management/domain/entities/usuario.entity';

export interface ListarSolicitacoesFilters {
  status?: StatusSolicitacao;
  tipo?: TipoSolicitacao;
  dataInicio?: Date;
  dataFim?: Date;
  page?: number;
  limit?: number;
}

export interface ListarSolicitacoesResponse {
  solicitacoes: SolicitacaoParceiro[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AprovarSolicitacaoResponse {
  message: string;
  solicitacao: SolicitacaoParceiro;
  usuarioId?: string;
  estabelecimentoId?: string;
}

export interface ListarUsuariosFilters {
  search?: string;
  status?: string;
  roles?: string[];
  page?: number;
  limit?: number;
}

export interface ListarUsuariosResponse {
  usuarios: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  estatisticas: {
    totalClientes: number;
    totalParceiros: number;
    totalEntregadores: number;
    usuariosAtivos: number;
    novosMesAtual: number;
  };
}

export interface AlterarStatusUsuarioResponse {
  message: string;
  usuario: {
    id: string;
    nome: string;
    status: string;
    atualizadoEm: Date;
  };
}

export interface IniciarReembolsoResponse {
  message: string;
  pedidoId: string;
  reembolsoId: string;
  valor: number;
  status: string;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly solicitacaoRepository: SolicitacaoParceiroRepository,
    private readonly accountService: AccountService,
    private readonly salesService: SalesService,
    private readonly paymentService: PaymentService,
  ) {}

  /**
   * Lista solicitações de parceiros com filtros
   */
  async listarSolicitacoes(filters: ListarSolicitacoesFilters = {}): Promise<ListarSolicitacoesResponse> {
    const {
      status,
      tipo,
      page = 1,
      limit = 10
    } = filters;

    let solicitacoes: SolicitacaoParceiro[];

    // Aplicar filtros
    if (status && tipo) {
      solicitacoes = await this.solicitacaoRepository.buscarPorTipoEStatus(tipo, status);
    } else if (status) {
      solicitacoes = await this.solicitacaoRepository.buscarPorStatus(status);
    } else if (tipo) {
      solicitacoes = await this.solicitacaoRepository.buscarPorTipo(tipo);
    } else {
      solicitacoes = await this.solicitacaoRepository.listarTodas();
    }

    // Aplicar paginação
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const solicitacoesPaginadas = solicitacoes.slice(startIndex, endIndex);

    return {
      solicitacoes: solicitacoesPaginadas,
      total: solicitacoes.length,
      page,
      limit,
      totalPages: Math.ceil(solicitacoes.length / limit)
    };
  }

  /**
   * Aprova uma solicitação de parceiro
   */
  async aprovarSolicitacao(solicitacaoId: string): Promise<AprovarSolicitacaoResponse> {
    this.logger.log(`Iniciando aprovação da solicitação ${solicitacaoId}`);

    // 1. Buscar solicitação
    const solicitacao = await this.solicitacaoRepository.buscarPorId(solicitacaoId);

    if (!solicitacao) {
      throw new NotFoundException('Solicitação não encontrada');
    }

    if (solicitacao.status !== StatusSolicitacao.PENDENTE) {
      throw new BadRequestException('Solicitação não está pendente');
    }

    let usuarioId: string | undefined;
    let estabelecimentoId: string | undefined;
    let solicitacaoModificada = false;

    try {
      // 2. Criar usuário parceiro via AccountService
      this.logger.log(`Criando usuário parceiro para solicitação ${solicitacaoId}`);
      usuarioId = await this.accountService.criarUsuarioParceiro(solicitacao);

      // 3. Se for loja, criar estabelecimento via SalesService
      if (solicitacao.tipo === TipoSolicitacao.LOJISTA) {
        this.logger.log(`Criando estabelecimento para solicitação ${solicitacaoId}`);
        estabelecimentoId = await this.salesService.criarEstabelecimento(solicitacao, usuarioId);
      }

      // 4. Aprovar solicitação
      solicitacao.aprovar('admin-system'); // TODO: Usar ID do admin logado
      solicitacaoModificada = true;
      await this.solicitacaoRepository.atualizar(solicitacao);

      // 5. Enviar notificação
      this.logger.log(`Notificação de aprovação enviada para ${solicitacao.email}`);

      this.logger.log(`Solicitação ${solicitacaoId} aprovada com sucesso`);

      return {
        message: 'Solicitação aprovada com sucesso',
        solicitacao,
        usuarioId,
        estabelecimentoId
      };    } catch (error) {
      this.logger.error(`Erro ao aprovar solicitação ${solicitacaoId}: ${error.message}`, error.stack);
      
      // Reverter aprovação em caso de erro
      if (solicitacaoModificada && (solicitacao as any).status === StatusSolicitacao.APROVADA) {
        (solicitacao as any).status = StatusSolicitacao.PENDENTE;
        await this.solicitacaoRepository.atualizar(solicitacao);
      }

      throw error;
    }
  }

  /**
   * Rejeita uma solicitação de parceiro
   */
  async rejeitarSolicitacao(solicitacaoId: string, motivo?: string): Promise<{ message: string; solicitacao: SolicitacaoParceiro }> {
    this.logger.log(`Rejeitando solicitação ${solicitacaoId}`);

    const solicitacao = await this.solicitacaoRepository.buscarPorId(solicitacaoId);

    if (!solicitacao) {
      throw new NotFoundException('Solicitação não encontrada');
    }

    if (solicitacao.status !== StatusSolicitacao.PENDENTE) {
      throw new BadRequestException('Solicitação não está pendente');
    }

    // Rejeitar solicitação
    solicitacao.rejeitar('admin-system', motivo || 'Não informado');
    await this.solicitacaoRepository.atualizar(solicitacao);

    // Enviar notificação de rejeição
    this.logger.log(`Notificação de rejeição enviada para ${solicitacao.email}`);

    this.logger.log(`Solicitação ${solicitacaoId} rejeitada`);

    return {
      message: 'Solicitação rejeitada com sucesso',
      solicitacao
    };
  }

  /**
   * Obtém estatísticas das solicitações
   */
  async obterEstatisticas(): Promise<any> {
    const [
      totalPendentes,
      totalAprovadas,
      totalRejeitadas,
      totalLojas,
      totalEntregadores
    ] = await Promise.all([
      this.solicitacaoRepository.contarPorStatus(StatusSolicitacao.PENDENTE),
      this.solicitacaoRepository.contarPorStatus(StatusSolicitacao.APROVADA),
      this.solicitacaoRepository.contarPorStatus(StatusSolicitacao.REJEITADA),
      this.solicitacaoRepository.contarPorTipo(TipoSolicitacao.LOJISTA),
      this.solicitacaoRepository.contarPorTipo(TipoSolicitacao.ENTREGADOR)
    ]);

    return {
      pendentes: totalPendentes,
      aprovadas: totalAprovadas,
      rejeitadas: totalRejeitadas,
      porTipo: {
        lojas: totalLojas,
        entregadores: totalEntregadores
      },
      total: totalPendentes + totalAprovadas + totalRejeitadas
    };
  }

  /**
   * Lista usuários com filtros
   */
  async listarUsuarios(filters: ListarUsuariosFilters = {}): Promise<ListarUsuariosResponse> {
    const {
      search,
      status,
      roles,
      page = 1,
      limit = 10
    } = filters;

    let usuarios: any[] = []; // Substitua pelo tipo correto
    let total = 0;

    // Aplicar filtros
    if (search) {
      // Buscar por nome, email ou CPF
      usuarios = await this.accountService.buscarUsuariosPorTermo(search);
    } else {
      // Listar todos os usuários
      usuarios = await this.accountService.listarTodosUsuarios();
    }

    // Filtrar por status e roles
    if (status) {
      usuarios = usuarios.filter(usuario => usuario.status === status);
    }

    if (roles && roles.length > 0) {
      usuarios = usuarios.filter(usuario => roles.includes(usuario.role));
    }

    // Contar total após filtros
    total = usuarios.length;

    // Aplicar paginação
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const usuariosPaginados = usuarios.slice(startIndex, endIndex);

    // Obter estatísticas
    const estatisticas = await this.obterEstatisticasUsuarios(usuarios);

    return {
      usuarios: usuariosPaginados,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      estatisticas
    };
  }

  /**
   * Obtém estatísticas dos usuários
   */
  private async obterEstatisticasUsuarios(usuarios: any[]): Promise<any> {
    const totalClientes = usuarios.filter(usuario => usuario.role === 'CLIENTE').length;
    const totalParceiros = usuarios.filter(usuario => usuario.role === 'PARCEIRO').length;
    const totalEntregadores = usuarios.filter(usuario => usuario.role === 'ENTREGADOR').length;
    const usuariosAtivos = usuarios.filter(usuario => usuario.status === 'ATIVO').length;
    const novosMesAtual = await this.accountService.contarNovosUsuariosMesAtual(); // Método a ser implementado no AccountService

    return {
      totalClientes,
      totalParceiros,
      totalEntregadores,
      usuariosAtivos,
      novosMesAtual
    };
  }
  /**
   * Altera o status de um usuário
   */
  async alterarStatusUsuario(usuarioId: string, status: string): Promise<AlterarStatusUsuarioResponse> {
    this.logger.log(`Alterando status do usuário ${usuarioId} para ${status}`);

    // 1. Buscar usuário
    const usuario = await this.accountService.buscarUsuarioPorId(usuarioId);

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // 2. Validar status
    if (!Object.values(StatusUsuario).includes(status as StatusUsuario)) {
      throw new BadRequestException('Status inválido');
    }

    // 3. Alterar status usando método da entidade
    usuario.alterarStatus(status as StatusUsuario);
    await this.accountService.atualizarUsuario(usuario);

    this.logger.log(`Status do usuário ${usuarioId} alterado para ${status}`);

    return {
      message: `Status do usuário alterado para ${status}`,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        status: usuario.status,
        atualizadoEm: usuario.updatedAt || new Date()
      }
    };
  }  /**
   * Inicia um reembolso para um pedido
   */
  async iniciarReembolso(pedidoId: string, motivo: string): Promise<IniciarReembolsoResponse> {
    this.logger.log(`Iniciando reembolso para o pedido ${pedidoId}`);

    // 1. Buscar e validar pedido
    const pedido = await this.salesService.buscarPedidoPorId(pedidoId);

    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado');
    }

    // 2. Validar se pedido pode ser reembolsado
    const validacao = this.salesService.validarReembolsoPedido(pedido);
    if (!validacao.podeReembolsar) {
      throw new BadRequestException(validacao.motivo || 'Pedido não pode ser reembolsado');
    }

    // 3. Criar solicitação de reembolso
    const reembolso = await this.paymentService.criarReembolso(pedido.valorTotal, motivo);

    // 4. Atualizar status do pedido
    pedido.status = StatusPedido.REEMBOLSO_SOLICITADO;
    await this.salesService.atualizarPedido(pedido);

    this.logger.log(`Reembolso solicitado para o pedido ${pedidoId}: ${JSON.stringify(reembolso)}`);

    return {
      message: 'Reembolso solicitado com sucesso',
      pedidoId,
      reembolsoId: reembolso.id,
      valor: reembolso.valor,
      status: reembolso.status
    };
  }
}
