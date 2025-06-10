import { Controller, Get, Post, Put, Delete, UseGuards, Req, Body, Param, Query, ValidationPipe, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../1-account-management/application/strategies/guards/jwt-auth.guard';
import { RolesGuard } from '../../../1-account-management/application/strategies/guards/roles.guard';
import { Roles } from '../../../1-account-management/application/strategies/guards/roles.decorator';
import { RoleType } from '../../../1-account-management/domain/enums/role-type.enum';
import { AdminService } from '../../application/services/admin.service';
import { ListarSolicitacoesDto } from '../dtos/listar-solicitacoes.dto';
import { AprovarSolicitacaoDto, RejeitarSolicitacaoDto } from '../dtos/aprovar-solicitacao.dto';
import { ListarUsuariosDto } from '../dtos/listar-usuarios.dto';
import { AlterarStatusUsuarioDto } from '../dtos/alterar-status-usuario.dto';
import { IniciarReembolsoDto } from '../dtos/iniciar-reembolso.dto';

@ApiTags('👑 Admin - Gestão')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.ADMIN)
@ApiBearerAuth('JWT-auth')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('solicitacoes')
  @ApiOperation({
    summary: 'Listar solicitações de parceiros',
    description: 'Lista todas as solicitações de parceiros com filtros opcionais por status, tipo e período.'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de solicitações retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        solicitacoes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'uuid-da-solicitacao' },
              tipo: { type: 'string', enum: ['LOJA', 'ENTREGADOR'] },
              status: { type: 'string', enum: ['PENDENTE', 'APROVADO', 'REJEITADO', 'EM_ANALISE'] },
              nomeCompleto: { type: 'string', example: 'João Silva' },
              email: { type: 'string', example: 'joao@email.com' },
              telefone: { type: 'string', example: '(11) 99999-9999' },
              criadoEm: { type: 'string', format: 'date-time' },
              atualizadoEm: { type: 'string', format: 'date-time' }
            }
          }
        },
        total: { type: 'number', example: 50 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
        totalPages: { type: 'number', example: 5 }
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - apenas administradores'
  })
  async listarSolicitacoes(@Query(ValidationPipe) filters: ListarSolicitacoesDto) {
    return await this.adminService.listarSolicitacoes(filters);
  }

  @Post('solicitacoes/:id/aprovar')
  @ApiOperation({
    summary: 'Aprovar solicitação de parceiro',
    description: 'Aprova uma solicitação de parceiro, criando usuário e estabelecimento (se aplicável).'
  })
  @ApiParam({
    name: 'id',
    description: 'ID da solicitação a ser aprovada',
    example: 'uuid-da-solicitacao'
  })
  @ApiBody({
    type: AprovarSolicitacaoDto,
    required: false
  })
  @ApiResponse({
    status: 200,
    description: 'Solicitação aprovada com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Solicitação aprovada com sucesso' },
        solicitacao: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            status: { type: 'string', example: 'APROVADO' },
            aprovadoEm: { type: 'string', format: 'date-time' }
          }
        },
        usuarioId: { type: 'string', example: 'uuid-do-usuario-criado' },
        estabelecimentoId: { type: 'string', example: 'uuid-do-estabelecimento-criado' }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Solicitação não encontrada'
  })
  @ApiResponse({
    status: 400,
    description: 'Solicitação não está pendente'
  })
  async aprovarSolicitacao(
    @Param('id') id: string,
    @Body() body: AprovarSolicitacaoDto
  ) {
    return await this.adminService.aprovarSolicitacao(id);
  }

  @Post('solicitacoes/:id/rejeitar')
  @ApiOperation({
    summary: 'Rejeitar solicitação de parceiro',
    description: 'Rejeita uma solicitação de parceiro com motivo obrigatório.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID da solicitação a ser rejeitada',
    example: 'uuid-da-solicitacao'
  })
  @ApiBody({
    type: RejeitarSolicitacaoDto
  })
  @ApiResponse({
    status: 200,
    description: 'Solicitação rejeitada com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Solicitação rejeitada com sucesso' },
        solicitacao: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            status: { type: 'string', example: 'REJEITADO' },
            rejeitadoEm: { type: 'string', format: 'date-time' },
            motivoRejeicao: { type: 'string' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Solicitação não encontrada'
  })
  @ApiResponse({
    status: 400,
    description: 'Solicitação não está pendente'
  })
  async rejeitarSolicitacao(
    @Param('id') id: string,
    @Body() body: RejeitarSolicitacaoDto
  ) {
    return await this.adminService.rejeitarSolicitacao(id, body.motivo);
  }

  @Get('solicitacoes/estatisticas')
  @ApiOperation({
    summary: 'Estatísticas das solicitações',
    description: 'Retorna estatísticas consolidadas das solicitações de parceiros.'
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas retornadas com sucesso',
    schema: {
      type: 'object',
      properties: {
        pendentes: { type: 'number', example: 15 },
        aprovadas: { type: 'number', example: 85 },
        rejeitadas: { type: 'number', example: 10 },
        porTipo: {
          type: 'object',
          properties: {
            lojas: { type: 'number', example: 60 },
            entregadores: { type: 'number', example: 50 }
          }
        },
        total: { type: 'number', example: 110 }
      }
    }
  })
  async obterEstatisticas() {
    return await this.adminService.obterEstatisticas();
  }  @Get('usuarios')
  @ApiOperation({
    summary: 'Listar todos os usuários',
    description: 'Lista todos os usuários do sistema com seus perfis e status. Apenas administradores têm acesso.'
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Termo de busca para filtrar por nome, email ou CPF',
    example: 'joão silva'
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filtrar por status do usuário',
    enum: ['ATIVO', 'INATIVO', 'SUSPENSO', 'PENDENTE']
  })
  @ApiQuery({
    name: 'roles',
    required: false,
    description: 'Filtrar por roles/perfis (pode ser múltiplos)',
    type: [String]
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Número da página',
    type: Number,
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Itens por página',
    type: Number,
    example: 10
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuários retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        usuarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'uuid-do-usuario' },
              nome: { type: 'string', example: 'João Silva' },
              email: { type: 'string', example: 'joao@email.com' },
              roles: { 
                type: 'array', 
                items: { type: 'string' },
                example: ['USER', 'PARTNER']
              },
              status: { 
                type: 'string', 
                example: 'ATIVO',
                enum: ['ATIVO', 'INATIVO', 'SUSPENSO', 'PENDENTE']
              },
              criadoEm: { type: 'string', format: 'date-time' },
              ultimoLogin: { type: 'string', format: 'date-time', nullable: true },
              totalPedidos: { type: 'number', example: 15 },
              avaliacaoMedia: { type: 'number', example: 4.5, nullable: true }
            }
          }
        },
        total: { type: 'number', example: 1250 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
        totalPages: { type: 'number', example: 125 },
        estatisticas: {
          type: 'object',
          properties: {
            totalClientes: { type: 'number', example: 1000 },
            totalParceiros: { type: 'number', example: 150 },
            totalEntregadores: { type: 'number', example: 100 },
            usuariosAtivos: { type: 'number', example: 1200 },
            novosMesAtual: { type: 'number', example: 25 }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - apenas administradores'
  })
  async listarUsuarios(@Query(ValidationPipe) filters: ListarUsuariosDto) {
    return await this.adminService.listarUsuarios(filters);
  }

  @Get('dashboard')
  @ApiOperation({
    summary: 'Dashboard administrativo',
    description: 'Retorna dados consolidados para dashboard administrativo com métricas principais.'
  })
  @ApiResponse({
    status: 200,
    description: 'Dados do dashboard',
    schema: {
      type: 'object',
      properties: {
        vendas: {
          type: 'object',
          properties: {
            totalHoje: { type: 'number', example: 1250.00 },
            totalMes: { type: 'number', example: 35000.00 },
            totalAno: { type: 'number', example: 420000.00 },
            pedidosHoje: { type: 'number', example: 45 },
            ticketMedio: { type: 'number', example: 27.78 }
          }
        },
        usuarios: {
          type: 'object',
          properties: {
            novosHoje: { type: 'number', example: 8 },
            novosMes: { type: 'number', example: 125 },
            totalAtivos: { type: 'number', example: 1200 }
          }
        },
        estabelecimentos: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 45 },
            ativos: { type: 'number', example: 42 },
            novosAguardandoAprovacao: { type: 'number', example: 3 }
          }
        },
        produtos: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 850 },
            ativos: { type: 'number', example: 800 },
            semEstoque: { type: 'number', example: 25 }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - apenas administradores'
  })
  getDashboard(@Req() req) {
    // TODO: Implementar lógica para dashboard
    return {
      vendas: {
        totalHoje: 1250.00,
        totalMes: 35000.00,
        totalAno: 420000.00,
        pedidosHoje: 45,
        ticketMedio: 27.78
      },
      usuarios: {
        novosHoje: 8,
        novosMes: 125,
        totalAtivos: 1200
      },
      estabelecimentos: {
        total: 45,
        ativos: 42,
        novosAguardandoAprovacao: 3
      },
      produtos: {
        total: 850,
        ativos: 800,
        semEstoque: 25
      },
      message: 'Funcionalidade em desenvolvimento - dados de exemplo'
    };
  }
  @Put('usuarios/:id/status')
  @ApiOperation({
    summary: 'Alterar status do usuário',
    description: 'Altera o status de um usuário (ativar, inativar, suspender).'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do usuário',
    example: 'uuid-do-usuario'
  })
  @ApiBody({
    type: AlterarStatusUsuarioDto
  })
  @ApiResponse({
    status: 200,
    description: 'Status alterado com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Status do usuário alterado para SUSPENSO' },
        usuario: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            nome: { type: 'string' },
            status: { type: 'string' },
            atualizadoEm: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado'
  })
  @ApiResponse({
    status: 400,
    description: 'Status inválido'
  })  async alterarStatusUsuario(
    @Param('id') id: string, 
    @Body(ValidationPipe) body: AlterarStatusUsuarioDto
  ) {
    return await this.adminService.alterarStatusUsuario(id, body.status);
  }

  @Post('pedidos/:id/reembolso')
  @ApiOperation({
    summary: 'Iniciar reembolso de pedido',
    description: 'Inicia o processo de reembolso para um pedido específico. Valida o pedido, processa o reembolso via gateway de pagamento e atualiza o status.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do pedido',
    example: 'uuid-do-pedido'
  })
  @ApiBody({
    type: IniciarReembolsoDto
  })
  @ApiResponse({
    status: 200,
    description: 'Reembolso iniciado com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Reembolso solicitado com sucesso' },
        pedidoId: { type: 'string', example: 'uuid-do-pedido' },
        reembolsoId: { type: 'string', example: 'reemb_123456789' },
        valor: { type: 'number', example: 49.90 },
        status: { type: 'string', example: 'succeeded' }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Pedido não encontrado'
  })
  @ApiResponse({
    status: 400,
    description: 'Pedido não pode ser reembolsado'
  })
  async iniciarReembolso(
    @Param('id') pedidoId: string,
    @Body(ValidationPipe) body: IniciarReembolsoDto
  ) {
    return await this.adminService.iniciarReembolso(pedidoId, body.motivo);
  }

  @Get('relatorios/vendas')
  @ApiOperation({
    summary: 'Relatório de vendas',
    description: 'Gera relatório detalhado de vendas com filtros por período.'
  })
  @ApiResponse({
    status: 200,
    description: 'Relatório de vendas',
    schema: {
      type: 'object',
      properties: {
        periodo: {
          type: 'object',
          properties: {
            inicio: { type: 'string', format: 'date' },
            fim: { type: 'string', format: 'date' }
          }
        },
        resumo: {
          type: 'object',
          properties: {
            totalVendas: { type: 'number', example: 125000.00 },
            totalPedidos: { type: 'number', example: 4500 },
            ticketMedio: { type: 'number', example: 27.78 },
            estabelecimentoMaisVendeu: { type: 'string', example: 'Hortifruti Central' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - apenas administradores'
  })
  relatorioVendas(@Req() req) {
    // TODO: Implementar relatório de vendas
    return {
      periodo: {
        inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        fim: new Date().toISOString().split('T')[0]
      },
      resumo: {
        totalVendas: 125000.00,
        totalPedidos: 4500,
        ticketMedio: 27.78,
        estabelecimentoMaisVendeu: 'Hortifruti Central'
      },
      message: 'Funcionalidade em desenvolvimento - dados de exemplo'
    };
  }
}
