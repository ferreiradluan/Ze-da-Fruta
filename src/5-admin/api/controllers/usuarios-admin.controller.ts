import { Controller, Get, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../1-account-management/guards/jwt-auth.guard';
import { RolesGuard } from '../../../1-account-management/guards/roles.guard';
import { Roles } from '../../../1-account-management/decorators/roles.decorator';
import { ROLE } from '../../../1-account-management/domain/types/role.types';
import { AccountService } from '../../../1-account-management/application/services/account.service';
import { STATUS_USUARIO_VALUES } from '../../../1-account-management/domain/types/status-usuario.types';

@ApiTags('👑 Admin - Usuários')
@Controller('admin/usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.ADMIN)
@ApiBearerAuth('JWT-auth')
export class UsuariosAdminController {
  constructor(private readonly accountService: AccountService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar usuários (Admin)',
    description: 'Lista todos os usuários da plataforma com filtros opcionais'
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: 'string',
    description: 'Buscar por nome ou email'
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: STATUS_USUARIO_VALUES,
    description: 'Filtrar por status do usuário'
  })
  @ApiQuery({
    name: 'roles',
    required: false,
    type: 'string',
    description: 'Filtrar por roles (separadas por vírgula)'
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'number',
    description: 'Página para paginação'
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: 'Limite de itens por página'
  })
  @ApiResponse({
    status: 200,
    description: 'Usuários listados com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'uuid-do-usuario' },
          nome: { type: 'string', example: 'João Silva' },
          email: { type: 'string', example: 'joao.silva@email.com' },
          status: { type: 'string', enum: STATUS_USUARIO_VALUES },
          createdAt: { type: 'string', format: 'date-time' },
          roles: { 
            type: 'array', 
            items: { type: 'string' },
            example: ['USER', 'SELLER']
          },
          perfil: { type: 'string', example: 'APROVADO' }
        }
      }
    }
  })
  async listarUsuarios(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('roles') roles?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    // TODO: Implementar filtros avançados no AccountService
    // Por enquanto retorna todos os usuários
    return this.accountService.listarTodosUsuarios();
  }

  @Get('pendentes')
  @ApiOperation({
    summary: 'Listar usuários pendentes de aprovação',
    description: 'Lista apenas os usuários com status PENDENTE aguardando aprovação administrativa'
  })
  @ApiResponse({
    status: 200,
    description: 'Usuários pendentes listados com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'uuid-do-usuario' },
          nome: { type: 'string', example: 'Maria Santos' },
          email: { type: 'string', example: 'maria.santos@email.com' },
          status: { type: 'string', example: 'PENDENTE' },
          createdAt: { type: 'string', format: 'date-time' },
          roles: { 
            type: 'array', 
            items: { type: 'string' },
            example: ['USER']
          },
          perfil: { type: 'string', example: 'PENDENTE' }
        }
      }
    }
  })
  async listarUsuariosPendentes() {
    return this.accountService.listarUsuariosPendentes();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obter informações de um usuário específico',
    description: 'Retorna os dados detalhados de um usuário pelo ID'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do usuário',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Usuário encontrado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid-do-usuario' },
        nome: { type: 'string', example: 'João Silva' },
        email: { type: 'string', example: 'joao.silva@email.com' },
        status: { type: 'string', enum: STATUS_USUARIO_VALUES },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        roles: { 
          type: 'array', 
          items: { type: 'string' },
          example: ['USER', 'SELLER']
        },
        perfil: {
          type: 'object',
          properties: {
            telefone: { type: 'string' },
            documento: { type: 'string' },
            statusPerfil: { type: 'string' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado'
  })
  async obterUsuario(@Param('id') usuarioId: string) {
    return this.accountService.obterUsuarioPorId(usuarioId);
  }

  @Put(':id/status')
  @ApiOperation({
    summary: 'Atualizar status do usuário',
    description: 'Atualiza o status de um usuário específico. Pode aprovar usuários pendentes.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do usuário',
    type: 'string'
  })
  @ApiBody({
    description: 'Novo status do usuário',
    schema: {
      type: 'object',
      properties: {
        status: { 
          type: 'string', 
          enum: STATUS_USUARIO_VALUES,
          example: 'ATIVO',
          description: 'Novo status do usuário'
        },
        motivo: {
          type: 'string',
          example: 'Aprovação após análise da documentação',
          description: 'Motivo da alteração de status (opcional)'
        }
      },
      required: ['status']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Status do usuário atualizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        usuarioId: { type: 'string', example: 'uuid-do-usuario' },
        statusAnterior: { type: 'string', example: 'PENDENTE' },
        novoStatus: { type: 'string', example: 'ATIVO' },
        message: { type: 'string', example: 'Status do usuário atualizado com sucesso' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Status inválido'
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado'
  })
  async atualizarStatusUsuario(
    @Param('id') usuarioId: string,
    @Body() body: { status: string; motivo?: string }
  ) {
    return this.accountService.atualizarStatusUsuario(usuarioId, body.status);
  }

  @Put(':id/aprovar')
  @ApiOperation({
    summary: 'Aprovar usuário pendente',
    description: 'Aprova um usuário com status PENDENTE, alterando seu status para ATIVO'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do usuário',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Usuário aprovado com sucesso',
    schema: {
      type: 'object',
      properties: {
        usuarioId: { type: 'string', example: 'uuid-do-usuario' },
        statusAnterior: { type: 'string', example: 'PENDENTE' },
        novoStatus: { type: 'string', example: 'ATIVO' },
        message: { type: 'string', example: 'Usuário aprovado com sucesso' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Usuário não está pendente de aprovação'
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado'
  })
  async aprovarUsuario(@Param('id') usuarioId: string) {
    return this.accountService.atualizarStatusUsuario(usuarioId, 'ATIVO');
  }
}
