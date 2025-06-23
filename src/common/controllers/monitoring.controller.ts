import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../decorators/public.decorator';
import { DomainMetricsService } from '../monitoring/domain-metrics.service';
import { DomainHealthService } from '../health/domain-health.service';

/**
 * 📊 FASE 6: MONITORING & HEALTH CONTROLLER
 * 
 * ✅ Endpoints para métricas e health checks
 * ✅ Integração com sistemas de monitoramento
 * ✅ Endpoints públicos para ferramentas externas
 */
@ApiTags('🏥 Monitoring & Health')
@Controller('monitoring')
export class MonitoringController {
  constructor(
    private readonly metricsService: DomainMetricsService,
    private readonly healthService: DomainHealthService
  ) {}

  // ===== HEALTH CHECK ENDPOINTS =====

  /**
   * ✅ Health check básico
   */
  @Get('health')
  @Public()
  @ApiOperation({
    summary: 'Health check básico',
    description: 'Verificação rápida do status do sistema'
  })
  @ApiResponse({
    status: 200,
    description: 'Sistema operacional',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        message: { type: 'string', example: 'Sistema operacional' },
        uptime: { type: 'number', example: 3600 }
      }
    }
  })
  async health() {
    return this.healthService.quickHealthCheck();
  }

  /**
   * ✅ Health check detalhado por domínios
   */
  @Get('health/domains')
  @Public()
  @ApiOperation({
    summary: 'Health check detalhado',
    description: 'Verificação detalhada da saúde de todos os domínios'
  })
  @ApiResponse({
    status: 200,
    description: 'Status detalhado dos domínios',
    schema: {
      type: 'object',
      properties: {
        overall: { 
          type: 'string', 
          enum: ['up', 'down', 'warning'],
          example: 'up' 
        },
        domains: {
          type: 'object',
          properties: {
            sales: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'up' },
                message: { type: 'string', example: 'Domínio de vendas operando normalmente' },
                details: { type: 'object' },
                timestamp: { type: 'string', format: 'date-time' }
              }
            },
            accounts: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'up' },
                message: { type: 'string', example: 'Domínio de contas operando normalmente' },
                details: { type: 'object' },
                timestamp: { type: 'string', format: 'date-time' }
              }
            }
          }
        },
        timestamp: { type: 'string', format: 'date-time' }
      }
    }
  })
  async healthDomains() {
    return this.healthService.checkAllDomains();
  }

  /**
   * ✅ Health check específico do domínio de vendas
   */
  @Get('health/sales')
  @Public()
  @ApiOperation({
    summary: 'Health check do domínio de vendas',
    description: 'Verificação específica da saúde do domínio de vendas'
  })
  @ApiResponse({
    status: 200,
    description: 'Status do domínio de vendas'
  })
  async healthSales() {
    return this.healthService.checkSalesDomain();
  }

  /**
   * ✅ Health check específico do domínio de contas
   */
  @Get('health/accounts')
  @Public()
  @ApiOperation({
    summary: 'Health check do domínio de contas',
    description: 'Verificação específica da saúde do domínio de contas'
  })
  @ApiResponse({
    status: 200,
    description: 'Status do domínio de contas'
  })
  async healthAccounts() {
    return this.healthService.checkAccountDomain();
  }

  // ===== METRICS ENDPOINTS =====

  /**
   * ✅ Métricas consolidadas dos domínios
   */
  @Get('metrics')
  @Public()
  @ApiOperation({
    summary: 'Métricas dos domínios',
    description: 'Métricas consolidadas de todos os domínios para monitoramento'
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas dos domínios',
    schema: {
      type: 'object',
      properties: {
        sales: {
          type: 'object',
          properties: {
            pedidosCriados: { type: 'number', example: 150 },
            valorTotalPedidos: { type: 'number', example: 4500.00 },
            itensVendidos: { type: 'number', example: 320 },
            estabelecimentosAtivos: { type: 'number', example: 5 },
            ticketMedio: { type: 'number', example: 30.00 }
          }
        },
        users: {
          type: 'object',
          properties: {
            usuariosCriados: { type: 'number', example: 75 },
            tiposUsuarios: {
              type: 'object',
              properties: {
                cliente: { type: 'number', example: 50 },
                vendedor: { type: 'number', example: 20 },
                admin: { type: 'number', example: 5 }
              }
            }
          }
        },
        products: {
          type: 'object',
          properties: {
            produtosCriados: { type: 'number', example: 200 },
            categorias: {
              type: 'object',
              properties: {
                frutas: { type: 'number', example: 80 },
                verduras: { type: 'number', example: 70 },
                legumes: { type: 'number', example: 50 }
              }
            }
          }
        },
        timestamp: { type: 'string', format: 'date-time' }
      }
    }
  })
  async metrics() {
    return this.metricsService.getDomainMetrics();
  }

  // ===== UTILITY ENDPOINTS =====

  /**
   * ✅ Reset métricas (útil para desenvolvimento/testes)
   */
  @Get('metrics/reset')
  @Public()
  @ApiOperation({
    summary: 'Reset das métricas',
    description: 'Reseta todas as métricas para zero (desenvolvimento apenas)'
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas resetadas com sucesso'
  })
  async resetMetrics() {
    if (process.env.NODE_ENV === 'production') {
      return {
        message: 'Reset de métricas não permitido em produção',
        status: 'blocked'
      };
    }

    this.metricsService.resetMetrics();
    return {
      message: 'Métricas resetadas com sucesso',
      status: 'reset',
      timestamp: new Date().toISOString()
    };
  }
}
