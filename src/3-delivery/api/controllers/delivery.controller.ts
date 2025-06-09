import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../1-account-management/application/strategies/guards/jwt-auth.guard';
import { RolesGuard } from '../../../1-account-management/application/strategies/guards/roles.guard';
import { Roles } from '../../../1-account-management/application/strategies/guards/roles.decorator';
import { RoleType } from '../../../1-account-management/domain/enums/role-type.enum';
import { DeliveryService } from '../../application/services/delivery.service';

@ApiTags('🚚 Entregador - Gestão de Entregas')
@Controller('delivery')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}
  @Get('profile/me')
  @Roles(RoleType.DELIVERY)
  @ApiOperation({
    summary: 'Meu perfil de entregador',
    description: 'Retorna informações do perfil do entregador autenticado. Apenas usuários com role DELIVERY têm acesso.'
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil do entregador retornado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid-do-entregador' },
        nome: { type: 'string', example: 'João Entregador' },
        email: { type: 'string', example: 'joao.entregador@email.com' },
        telefone: { type: 'string', example: '(11) 99999-1111' },
        veiculo: {
          type: 'object',
          properties: {
            tipo: { type: 'string', example: 'moto', enum: ['moto', 'bicicleta', 'carro', 'a_pe'] },
            modelo: { type: 'string', example: 'Honda CG 160' },
            placa: { type: 'string', example: 'ABC-1234' }
          }
        },
        status: { 
          type: 'string', 
          example: 'DISPONIVEL',
          enum: ['DISPONIVEL', 'OCUPADO', 'OFFLINE', 'PAUSADO']
        },
        avaliacaoMedia: { type: 'number', example: 4.8 },
        totalEntregas: { type: 'number', example: 150 },
        ativo: { type: 'boolean', example: true },
        localizacaoAtual: {
          type: 'object',
          properties: {
            latitude: { type: 'number', example: -23.5505 },
            longitude: { type: 'number', example: -46.6333 },
            atualizadoEm: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - apenas entregadores'
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou expirado'
  })
  getMyProfile(@Req() req) {
    // TODO: Implementar lógica para buscar perfil do entregador
    return {
      id: req.user.id,
      nome: req.user.nome || 'Entregador',
      email: req.user.email,
      telefone: '(11) 99999-1111',
      veiculo: {
        tipo: 'moto',
        modelo: 'Honda CG 160',
        placa: 'ABC-1234'
      },
      status: 'DISPONIVEL',
      avaliacaoMedia: 4.8,
      totalEntregas: 150,
      ativo: true,
      localizacaoAtual: {
        latitude: -23.5505,
        longitude: -46.6333,
        atualizadoEm: new Date().toISOString()
      },
      message: 'Funcionalidade em desenvolvimento - dados de exemplo'
    };
  }
  @Get('entregas/disponiveis')
  @Roles(RoleType.DELIVERY)
  @ApiOperation({
    summary: 'Listar entregas disponíveis',
    description: 'Lista todas as entregas disponíveis para aceite pelo entregador autenticado.'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de entregas disponíveis retornada com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'uuid-da-entrega' },
          pedidoId: { type: 'string', example: 'uuid-do-pedido' },
          status: { type: 'string', example: 'AGUARDANDO_ACEITE' },
          enderecoColeta: {
            type: 'object',
            properties: {
              rua: { type: 'string', example: 'Rua das Flores' },
              numero: { type: 'string', example: '123' },
              bairro: { type: 'string', example: 'Centro' },
              cidade: { type: 'string', example: 'São Paulo' },
              estado: { type: 'string', example: 'SP' },
              cep: { type: 'string', example: '01234-567' }
            }
          },
          enderecoEntrega: {
            type: 'object',
            properties: {
              rua: { type: 'string', example: 'Av. Paulista' },
              numero: { type: 'string', example: '1000' },
              bairro: { type: 'string', example: 'Bela Vista' },
              cidade: { type: 'string', example: 'São Paulo' },
              estado: { type: 'string', example: 'SP' },
              cep: { type: 'string', example: '01310-100' }
            }
          },
          valorFrete: { type: 'number', example: 8.50 },
          previsaoEntrega: { type: 'string', format: 'date-time' },
          observacoes: { type: 'string', example: 'Pedido confirmado - Cliente: maria@email.com - Valor: R$ 45.90' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - apenas entregadores'
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou expirado'
  })
  async getEntregasDisponiveis() {
    return await this.deliveryService.buscarEntregasDisponiveis();
  }

  @Post('entregas/:id/aceitar')
  @Roles(RoleType.DELIVERY)
  @ApiOperation({
    summary: 'Aceitar entrega',
    description: 'Permite que o entregador aceite uma entrega específica disponível.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID da entrega a ser aceita',
    example: 'uuid-da-entrega'
  })
  @ApiResponse({
    status: 200,
    description: 'Entrega aceita com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid-da-entrega' },
        pedidoId: { type: 'string', example: 'uuid-do-pedido' },
        entregadorId: { type: 'string', example: 'uuid-do-entregador' },
        status: { type: 'string', example: 'PENDENTE' },
        enderecoColeta: {
          type: 'object',
          properties: {
            rua: { type: 'string', example: 'Rua das Flores' },
            numero: { type: 'string', example: '123' },
            bairro: { type: 'string', example: 'Centro' },
            cidade: { type: 'string', example: 'São Paulo' },
            estado: { type: 'string', example: 'SP' },
            cep: { type: 'string', example: '01234-567' }
          }
        },
        enderecoEntrega: {
          type: 'object',
          properties: {
            rua: { type: 'string', example: 'Av. Paulista' },
            numero: { type: 'string', example: '1000' },
            bairro: { type: 'string', example: 'Bela Vista' },
            cidade: { type: 'string', example: 'São Paulo' },
            estado: { type: 'string', example: 'SP' },
            cep: { type: 'string', example: '01310-100' }
          }
        },
        valorFrete: { type: 'number', example: 8.50 },
        previsaoEntrega: { type: 'string', format: 'date-time' },
        observacoes: { type: 'string', example: 'Pedido confirmado - Cliente: maria@email.com - Valor: R$ 45.90' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Entrega não encontrada'
  })
  @ApiResponse({
    status: 403,
    description: 'Entrega não está mais disponível para aceite ou entregador não está disponível'
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou expirado'
  })
  async aceitarEntrega(@Param('id') entregaId: string, @Req() req) {
    const entregadorId = req.user.entregadorId || req.user.id;
    return await this.deliveryService.aceitarEntrega(entregaId, entregadorId);
  }
}
