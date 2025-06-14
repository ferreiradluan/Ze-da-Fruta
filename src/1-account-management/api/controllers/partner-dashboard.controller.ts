import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { Role3 } from '../../enums/role.enum';
import { SalesService } from '../../../2-sales/application/services/sales.service';

@ApiTags('🏪 Parceiro - Dashboard')
@Controller('partner/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role3.SELLER)
@ApiBearerAuth('JWT-auth')
export class PartnerDashboardController {
  constructor(private readonly salesService: SalesService) {}

  @Get('resumo')
  @ApiOperation({
    summary: 'Obter resumo do dashboard do parceiro',
    description: 'Retorna estatísticas e resumo das atividades do parceiro'
  })
  @ApiResponse({
    status: 200,
    description: 'Resumo do dashboard retornado com sucesso',
    schema: {
      type: 'object',
      properties: {
        pedidos: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 150 },
            pendentes: { type: 'number', example: 12 },
            emAndamento: { type: 'number', example: 8 },
            concluidos: { type: 'number', example: 130 }
          }
        },
        vendas: {
          type: 'object',
          properties: {
            hoje: { type: 'number', example: 450.00 },
            semana: { type: 'number', example: 2800.00 },
            mes: { type: 'number', example: 12500.00 }
          }
        },
        produtos: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 45 },
            ativos: { type: 'number', example: 42 },
            inativos: { type: 'number', example: 3 }
          }
        }
      }
    }
  })
  async obterResumoDashboard(@Req() req) {
    const parceiroId = req.user.id;
    
    // TODO: Implementar método específico no service
    // Por enquanto retorna dados mockados para manter a interface
    return {
      pedidos: {
        total: 0,
        pendentes: 0,
        emAndamento: 0,
        concluidos: 0
      },
      vendas: {
        hoje: 0,
        semana: 0,
        mes: 0
      },
      produtos: {
        total: 0,
        ativos: 0,
        inativos: 0
      }
    };
  }

  @Get('pedidos-recentes')
  @ApiOperation({
    summary: 'Obter pedidos recentes',
    description: 'Retorna os últimos pedidos do parceiro'
  })
  @ApiResponse({
    status: 200,
    description: 'Pedidos recentes retornados com sucesso'
  })
  async obterPedidosRecentes(@Req() req) {
    const parceiroId = req.user.id;
    
    // TODO: Implementar busca de pedidos recentes por parceiro
    // Por enquanto usa método existente limitando resultados
    try {
      const pedidos = await this.salesService.listarPedidosPorEstabelecimento(parceiroId);
      return pedidos.slice(0, 10); // Últimos 10 pedidos
    } catch (error) {
      return [];
    }
  }
}
