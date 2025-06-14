import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../decorators/public.decorator';
import { DomainHealthService } from '../health/domain-health.service';
import { DomainMetricsService } from '../monitoring/domain-metrics.service';
import { SystemMetricsHelper } from '../middleware/system-metrics.middleware';

/**
 * 🏥 FASE 6: HEALTH CONTROLLER
 * 
 * ✅ Endpoints de health check públicos
 * ✅ Métricas de domínio expostas
 * ✅ Monitoramento para sistemas externos
 * ✅ Status consolidado do sistema
 */
@ApiTags('🏥 Health & Monitoring')
@Controller('health')
export class HealthController {
  constructor(
    private readonly domainHealthService: DomainHealthService,
    private readonly domainMetricsService: DomainMetricsService,
  ) {}

  /**
   * ✅ Health check rápido para load balancer
   */
  @Get()
  @Public()
  @ApiOperation({
    summary: 'Health check rápido',
    description: 'Verificação básica de saúde do sistema para load balancers'
  })
  @ApiResponse({
    status: 200,
    description: 'Sistema operacional',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        message: { type: 'string', example: 'Sistema operacional' },
        uptime: { type: 'number', example: 3600 },
        timestamp: { type: 'string', example: '2025-06-14T10:30:00Z' }
      }
    }
  })
  @ApiResponse({
    status: 503,
    description: 'Sistema com problemas'
  })
  async healthCheck() {
    const result = await this.domainHealthService.quickHealthCheck();
    return {
      ...result,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * ✅ Health check detalhado por domínios
   */
  @Get('detailed')
  @Public()
  @ApiOperation({
    summary: 'Health check detalhado',
    description: 'Verificação detalhada de saúde por domínio de negócio'
  })
  @ApiResponse({
    status: 200,
    description: 'Status detalhado dos domínios',
    schema: {
      type: 'object',
      properties: {
        overall: { type: 'string', enum: ['up', 'down', 'warning'] },
        domains: {
          type: 'object',
          properties: {
            sales: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['up', 'down', 'warning'] },
                message: { type: 'string' },
                details: { type: 'object' }
              }
            },
            accounts: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['up', 'down', 'warning'] },
                message: { type: 'string' },
                details: { type: 'object' }
              }
            }
          }
        }
      }
    }
  })
  async detailedHealthCheck() {
    return this.domainHealthService.checkAllDomains();
  }

  /**
   * ✅ Métricas de domínio para monitoramento
   */
  @Get('metrics')
  @Public()
  @ApiOperation({
    summary: 'Métricas de domínio',
    description: 'Métricas de negócio coletadas por domínio'
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
            pedidosCriados: { type: 'number' },
            valorTotalPedidos: { type: 'number' },
            itensVendidos: { type: 'number' },
            estabelecimentosAtivos: { type: 'number' },
            ticketMedio: { type: 'number' }
          }
        },
        users: {
          type: 'object',
          properties: {
            usuariosCriados: { type: 'number' },
            tiposUsuarios: { type: 'object' }
          }
        },
        products: {
          type: 'object',
          properties: {
            produtosCriados: { type: 'number' },
            categorias: { type: 'object' }
          }
        }
      }
    }
  })
  async getMetrics() {
    return this.domainMetricsService.getDomainMetrics();
  }

  /**
   * ✅ Health check específico do domínio de vendas
   */
  @Get('sales')
  @Public()
  @ApiOperation({
    summary: 'Health check do domínio de vendas',
    description: 'Verificação específica da saúde do domínio de vendas'
  })
  async salesHealthCheck() {
    return this.domainHealthService.checkSalesDomain();
  }

  /**
   * ✅ Health check específico do domínio de contas
   */
  @Get('accounts')
  @Public()
  @ApiOperation({
    summary: 'Health check do domínio de contas',
    description: 'Verificação específica da saúde do domínio de contas'
  })
  async accountsHealthCheck() {
    return this.domainHealthService.checkAccountDomain();
  }

  /**
   * ✅ Status do sistema em formato Prometheus
   */
  @Get('prometheus')
  @Public()
  @ApiOperation({
    summary: 'Métricas em formato Prometheus',
    description: 'Métricas expostas em formato compatível com Prometheus'
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas em formato texto',
    content: {
      'text/plain': {
        example: `# HELP pedidos_criados_total Total de pedidos criados
# TYPE pedidos_criados_total counter
pedidos_criados_total 150

# HELP valor_total_pedidos_real Valor total dos pedidos em reais
# TYPE valor_total_pedidos_real gauge
valor_total_pedidos_real 4500.50`
      }
    }
  })
  async prometheusMetrics() {
    const metrics = this.domainMetricsService.getDomainMetrics();
    
    // Formato Prometheus
    const lines = [
      '# HELP pedidos_criados_total Total de pedidos criados',
      '# TYPE pedidos_criados_total counter',
      `pedidos_criados_total ${metrics.sales.pedidosCriados}`,
      '',
      '# HELP valor_total_pedidos_real Valor total dos pedidos em reais',
      '# TYPE valor_total_pedidos_real gauge',
      `valor_total_pedidos_real ${metrics.sales.valorTotalPedidos}`,
      '',
      '# HELP itens_vendidos_total Total de itens vendidos',
      '# TYPE itens_vendidos_total counter',
      `itens_vendidos_total ${metrics.sales.itensVendidos}`,
      '',
      '# HELP estabelecimentos_ativos Número de estabelecimentos ativos',
      '# TYPE estabelecimentos_ativos gauge',
      `estabelecimentos_ativos ${metrics.sales.estabelecimentosAtivos}`,
      '',
      '# HELP usuarios_criados_total Total de usuários criados',
      '# TYPE usuarios_criados_total counter',
      `usuarios_criados_total ${metrics.users.usuariosCriados}`,
      '',
      '# HELP produtos_criados_total Total de produtos criados',
      '# TYPE produtos_criados_total counter',
      `produtos_criados_total ${metrics.products.produtosCriados}`,
      ''
    ];

    return lines.join('\n');
  }

  /**
   * ✅ Métricas de sistema (CPU, Memória)
   */
  @Get('system')
  @Public()
  @ApiOperation({
    summary: 'Métricas de sistema',
    description: 'Informações sobre CPU, memória e performance do sistema'
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas de sistema',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        uptime: { type: 'number' },
        memory: {
          type: 'object',
          properties: {
            rss: { type: 'number' },
            heapUsed: { type: 'number' },
            heapTotal: { type: 'number' },
            external: { type: 'number' }
          }
        },
        cpu: {
          type: 'object',
          properties: {
            user: { type: 'number' },
            system: { type: 'number' }
          }
        }
      }
    }
  })
  async getSystemMetrics() {
    return SystemMetricsHelper.getSystemStatus();
  }

  /**
   * ✅ Status de saúde do sistema
   */
  @Get('system/status')
  @Public()
  @ApiOperation({
    summary: 'Status de saúde do sistema',
    description: 'Verificação de saúde baseada em métricas de sistema'
  })
  async getSystemHealth() {
    return SystemMetricsHelper.getHealthStatus();
  }
}
