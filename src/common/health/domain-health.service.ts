import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Entities
import { Pedido } from '../../2-sales/domain/entities/pedido.entity';
import { Produto } from '../../2-sales/domain/entities/produto.entity';
import { Estabelecimento } from '../../2-sales/domain/entities/estabelecimento.entity';
import { Usuario } from '../../1-account-management/domain/entities/usuario.entity';

// Enums
import { STATUS_PEDIDO, StatusPedido } from '../../2-sales/domain/types/status-pedido.types';

// ===== INTERFACES =====
export interface HealthIndicatorResult {
  status: 'up' | 'down' | 'warning';
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

/**
 * 🏥 FASE 6: DOMAIN HEALTH SERVICE
 * 
 * ✅ Health checks por módulo/domínio
 * ✅ Verificação de integridade de dados
 * ✅ Alertas automáticos para problemas
 * ✅ Interface para sistemas de monitoramento
 */
@Injectable()
export class DomainHealthService {
  private readonly logger = new Logger(DomainHealthService.name);
  constructor(
    @InjectRepository(Pedido)
    private pedidoRepository: Repository<Pedido>,
    @InjectRepository(Produto)
    private produtoRepository: Repository<Produto>,
    @InjectRepository(Estabelecimento)
    private estabelecimentoRepository: Repository<Estabelecimento>,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>
  ) {}

  // ===== SALES DOMAIN HEALTH CHECKS =====

  /**
   * ✅ Health check do domínio de vendas
   */
  async checkSalesDomain(): Promise<HealthIndicatorResult> {
    try {
      const [
        pedidosPendentes,
        produtosSemEstoque,
        estabelecimentosAtivos
      ] = await Promise.all([        this.pedidoRepository.count({ 
          where: { status: STATUS_PEDIDO.PAGAMENTO_PENDENTE } 
        }),
        this.produtoRepository.count({ 
          where: { estoque: 0, ativo: true } 
        }),
        this.estabelecimentoRepository.count({ 
          where: { ativo: true } 
        })
      ]);

      // Critérios de saúde
      const isSalesHealthy = pedidosPendentes < 1000 && produtosSemEstoque < 100;
      const hasWarnings = pedidosPendentes > 500 || produtosSemEstoque > 50;

      return {
        status: !isSalesHealthy ? 'down' : hasWarnings ? 'warning' : 'up',
        message: isSalesHealthy 
          ? 'Domínio de vendas operando normalmente' 
          : 'Domínio de vendas com problemas',
        details: {
          pedidosPendentes,
          produtosSemEstoque,
          estabelecimentosAtivos,
          limites: {
            maxPedidosPendentes: 1000,
            maxProdutosSemEstoque: 100,
            alertPedidosPendentes: 500,
            alertProdutosSemEstoque: 50
          }
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`❌ Erro no health check de vendas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return {
        status: 'down',
        message: 'Erro ao verificar saúde do domínio de vendas',
        details: { 
          error: error instanceof Error ? error.message : 'Erro desconhecido' 
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * ✅ Health check do domínio de usuários/contas
   */
  async checkAccountDomain(): Promise<HealthIndicatorResult> {
    try {
      const [
        totalUsuarios,
        usuariosAtivos,        usuariosSuspensos
      ] = await Promise.all([        this.usuarioRepository.count(),
        this.usuarioRepository.count({ 
          where: { status: 'ATIVO' } 
        }),
        this.usuarioRepository.count({ 
          where: { status: 'SUSPENSO' } 
        })
      ]);

      const percentualSuspensos = totalUsuarios > 0 
        ? (usuariosSuspensos / totalUsuarios) * 100 
        : 0;

      const isAccountHealthy = percentualSuspensos < 10; // Menos de 10% suspensos
      const hasWarnings = percentualSuspensos > 5; // Alerta com 5% suspensos

      return {
        status: !isAccountHealthy ? 'down' : hasWarnings ? 'warning' : 'up',
        message: isAccountHealthy 
          ? 'Domínio de contas operando normalmente' 
          : 'Domínio de contas com problemas',
        details: {
          totalUsuarios,
          usuariosAtivos,
          usuariosSuspensos,
          percentualSuspensos: Math.round(percentualSuspensos * 100) / 100,
          limites: {
            maxPercentualSuspensos: 10,
            alertPercentualSuspensos: 5
          }
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`❌ Erro no health check de contas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return {
        status: 'down',
        message: 'Erro ao verificar saúde do domínio de contas',
        details: { 
          error: error instanceof Error ? error.message : 'Erro desconhecido' 
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * ✅ Health check consolidado de todos os domínios
   */
  async checkAllDomains(): Promise<{
    overall: 'up' | 'down' | 'warning';
    domains: Record<string, HealthIndicatorResult>;
    timestamp: string;
  }> {
    const [
      salesHealth,
      accountHealth
    ] = await Promise.all([
      this.checkSalesDomain(),
      this.checkAccountDomain()
    ]);

    const domains = {
      sales: salesHealth,
      accounts: accountHealth
    };

    // Determinar status geral
    const hasDown = Object.values(domains).some(domain => domain.status === 'down');
    const hasWarning = Object.values(domains).some(domain => domain.status === 'warning');

    const overall = hasDown ? 'down' : hasWarning ? 'warning' : 'up';

    return {
      overall,
      domains,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * ✅ Verificação rápida para endpoints de health
   */
  async quickHealthCheck(): Promise<{
    status: 'ok' | 'error';
    message: string;
    uptime: number;
  }> {
    try {
      // Verificação básica de conectividade com o banco
      await this.usuarioRepository.count();
      
      return {
        status: 'ok',
        message: 'Sistema operacional',
        uptime: process.uptime()
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Erro de conectividade com banco de dados',
        uptime: process.uptime()
      };
    }
  }
}
