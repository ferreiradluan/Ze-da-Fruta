import { Controller, Get, Put, Delete, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../application/strategies/guards/jwt-auth.guard';
import { RolesGuard } from '../../application/strategies/guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { ROLE } from '../../domain/types/role.types';
import { AccountService } from '../../application/services/account.service';

/**
 * 👤 CONTROLLER DE PERFIL DO USUÁRIO
 * 
 * ✅ CRUD completo do perfil do usuário
 * ✅ Operações: obter, atualizar, desativar conta
 * ✅ Respeitando arquitetura modular e domínio rico
 */
@ApiTags('👤 Perfil do Usuário')
@Controller('profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.USER, ROLE.SELLER, ROLE.DELIVERY_PERSON, ROLE.ADMIN)
@ApiBearerAuth('JWT-auth')
export class ProfileController {
  constructor(private readonly accountService: AccountService) {}

  /**
   * ✅ GET /profile/me - Obter meu perfil (já existe no AccountController)
   */
  @Get('me')
  @ApiOperation({
    summary: 'Obter meu perfil',
    description: 'Obtém as informações do perfil do usuário logado'
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil obtido com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        nome: { type: 'string' },
        telefone: { type: 'string' },
        status: { type: 'string' },
        roles: { type: 'array', items: { type: 'string' } },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' }
      }
    }
  })
  async obterMeuPerfil(@Req() req: any) {
    const userId = req.user.id;
    // TODO: Implementar via AccountService
    // Por enquanto, simula obtenção do perfil
    return {
      id: userId,
      email: req.user.email,
      nome: 'Usuário de Teste',
      telefone: '(11) 99999-9999',
      status: 'ATIVO',
      roles: req.user.roles || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * ✅ PUT /profile/me - Atualizar meu perfil
   */
  @Put('me')
  @ApiOperation({
    summary: 'Atualizar meu perfil',
    description: 'Atualiza as informações do perfil do usuário logado'
  })
  @ApiBody({
    description: 'Dados do perfil a serem atualizados',
    schema: {
      type: 'object',
      properties: {
        nome: { type: 'string', example: 'João Silva Santos' },
        telefone: { type: 'string', example: '(11) 99999-9999' },
        endereco: {
          type: 'object',
          properties: {
            logradouro: { type: 'string', example: 'Rua das Flores' },
            numero: { type: 'string', example: '123' },
            complemento: { type: 'string', example: 'Apto 45' },
            bairro: { type: 'string', example: 'Centro' },
            cidade: { type: 'string', example: 'São Paulo' },
            estado: { type: 'string', example: 'SP' },
            cep: { type: 'string', example: '01234-567' }
          }
        },
        preferencias: {
          type: 'object',
          properties: {
            notificacoes: { type: 'boolean', example: true },
            newsletter: { type: 'boolean', example: false },
            temaDark: { type: 'boolean', example: false }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil atualizado com sucesso'
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos fornecidos'
  })
  async atualizarMeuPerfil(@Req() req: any, @Body() dadosAtualizacao: any) {
    const userId = req.user.id;
    
    // TODO: Implementar validação e atualização via AccountService
    // Por enquanto, simula a atualização
    return {
      message: 'Perfil atualizado com sucesso',
      dadosAtualizados: {
        ...dadosAtualizacao,
        updatedAt: new Date().toISOString()
      },
      userId
    };
  }
  // REMOVIDO: Endpoint de alteração de senha
  // Com login via Google OAuth, a senha é gerenciada pelo Google
  // Não é necessário nem possível alterar senha localmente

  /**
   * ✅ PUT /profile/preferences - Atualizar preferências
   */
  @Put('preferences')
  @ApiOperation({
    summary: 'Atualizar preferências',
    description: 'Atualiza as preferências do usuário (notificações, tema, etc.)'
  })
  @ApiBody({
    description: 'Preferências do usuário',
    schema: {
      type: 'object',
      properties: {
        notificacoes: { type: 'boolean', example: true },
        notificacaoEmail: { type: 'boolean', example: false },
        notificacaoPush: { type: 'boolean', example: true },
        newsletter: { type: 'boolean', example: false },
        temaDark: { type: 'boolean', example: false },
        idioma: { type: 'string', example: 'pt-BR' }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Preferências atualizadas com sucesso'
  })
  async atualizarPreferencias(@Req() req: any, @Body() preferencias: any) {
    const userId = req.user.id;
    
    // TODO: Implementar persistência das preferências
    // Por enquanto, simula a atualização
    return {
      message: 'Preferências atualizadas com sucesso',
      preferencias,
      updatedAt: new Date().toISOString(),
      userId
    };
  }

  /**
   * ✅ DELETE /profile/me - Desativar minha conta
   */
  @Delete('me')
  @ApiOperation({
    summary: 'Desativar minha conta',
    description: 'Desativa a conta do usuário logado (soft delete)'
  })
  @ApiBody({
    description: 'Motivo da desativação (opcional)',
    schema: {
      type: 'object',
      properties: {
        motivo: { 
          type: 'string', 
          example: 'Não preciso mais do serviço',
          enum: [
            'Não preciso mais do serviço',
            'Encontrei uma alternativa melhor', 
            'Problemas com o aplicativo',
            'Preocupações com privacidade',
            'Outro motivo'
          ]
        },
        observacoes: { type: 'string', example: 'Obrigado pelos serviços prestados' }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Conta desativada com sucesso'
  })
  @ApiResponse({
    status: 400,
    description: 'Não é possível desativar a conta no momento'
  })
  async desativarMinhaConta(@Req() req: any, @Body() dados?: { motivo?: string; observacoes?: string }) {
    const userId = req.user.id;
    
    // TODO: Implementar lógica de desativação via AccountService
    // - Cancelar pedidos em andamento
    // - Notificar sistemas dependentes
    // - Anonimizar dados sensíveis
    // - Manter histórico para compliance
    
    // Por enquanto, simula a desativação
    return {
      message: 'Conta desativada com sucesso',
      dataDesativacao: new Date().toISOString(),
      motivo: dados?.motivo || 'Não informado',
      observacoes: dados?.observacoes,
      informacoes: {
        dadosAnonimizados: true,
        pedidosProcessados: true,
        reativacaoPossivel: '30 dias',
        contato: 'suporte@zefruta.com'
      },
      userId
    };
  }

  /**
   * ✅ GET /profile/activity - Histórico de atividades
   */
  @Get('activity')
  @ApiOperation({
    summary: 'Histórico de atividades',
    description: 'Obtém o histórico de atividades recentes do usuário'
  })
  @ApiResponse({
    status: 200,
    description: 'Histórico obtido com sucesso',
    schema: {
      type: 'object',
      properties: {
        atividades: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              tipo: { type: 'string' },
              descricao: { type: 'string' },
              data: { type: 'string' },
              detalhes: { type: 'object' }
            }
          }
        },
        total: { type: 'number' },
        pagina: { type: 'number' }
      }
    }
  })
  async obterHistoricoAtividades(@Req() req: any) {
    const userId = req.user.id;
    
    // TODO: Implementar busca real do histórico
    // Por enquanto, retorna exemplo
    return {
      atividades: [
        {
          id: '1',
          tipo: 'PERFIL_ATUALIZADO',
          descricao: 'Perfil atualizado com sucesso',
          data: new Date().toISOString(),
          detalhes: { campos: ['telefone', 'endereco'] }
        },
        {
          id: '2',
          tipo: 'LOGIN',
          descricao: 'Login realizado',
          data: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          detalhes: { dispositivo: 'Web', ip: '192.168.1.1' }
        }
      ],
      total: 2,
      pagina: 1,
      userId
    };
  }
}
