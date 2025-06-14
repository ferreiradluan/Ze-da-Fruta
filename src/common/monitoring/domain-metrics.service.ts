import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

// Events
import { PedidoCriadoEvent } from '../../2-sales/domain/events/pedido.events';

/**
 * 📊 FASE 6: DOMAIN METRICS SERVICE
 * 
 * ✅ Métricas por domínio baseadas em eventos
 * ✅ Coleta de métricas de negócio
 * ✅ Logging estruturado para monitoramento
 * ✅ Interface para integração com sistemas externos (Prometheus, Grafana)
 */
@Injectable()
export class DomainMetricsService {
  private readonly logger = new Logger(DomainMetricsService.name);

  // ===== CONTADORES EM MEMÓRIA =====
  private metrics = {
    sales: {
      pedidosCriados: 0,
      valorTotalPedidos: 0,
      itensVendidos: 0,
      estabelecimentos: new Set<string>()
    },
    users: {
      usuariosCriados: 0,
      tiposUsuarios: new Map<string, number>()
    },
    products: {
      produtosCriados: 0,
      categorias: new Map<string, number>()
    }
  };

  // ===== EVENT HANDLERS =====

  /**
   * ✅ Métricas quando pedido é criado
   */
  @OnEvent('pedido.criado')
  async handlePedidoCriado(event: PedidoCriadoEvent): Promise<void> {
    try {
      // Incrementar contadores
      this.metrics.sales.pedidosCriados++;
      this.metrics.sales.valorTotalPedidos += event.valorTotal;
      this.metrics.sales.itensVendidos += event.quantidadeItens;
      
      if (event.estabelecimentoId) {
        this.metrics.sales.estabelecimentos.add(event.estabelecimentoId);
      }

      // Log estruturado para monitoramento
      this.logger.log(JSON.stringify({
        event: 'pedido_criado',
        pedidoId: event.aggregateId,
        clienteId: event.clienteId,
        valorTotal: event.valorTotal,
        quantidadeItens: event.quantidadeItens,
        estabelecimentoId: event.estabelecimentoId,
        timestamp: new Date().toISOString(),
        metrics: {
          totalPedidos: this.metrics.sales.pedidosCriados,
          valorAcumulado: this.metrics.sales.valorTotalPedidos
        }
      }));

    } catch (error) {
      this.logger.error(`❌ Erro ao registrar métricas de pedido: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * ✅ Métricas de usuários
   */
  @OnEvent('usuario.criado')
  async handleUsuarioCriado(event: any): Promise<void> {
    try {
      this.metrics.users.usuariosCriados++;
      
      const tipoUsuario = event.tipo || 'cliente';
      const currentCount = this.metrics.users.tiposUsuarios.get(tipoUsuario) || 0;
      this.metrics.users.tiposUsuarios.set(tipoUsuario, currentCount + 1);

      this.logger.log(JSON.stringify({
        event: 'usuario_criado',
        usuarioId: event.aggregateId,
        tipo: tipoUsuario,
        timestamp: new Date().toISOString(),
        metrics: {
          totalUsuarios: this.metrics.users.usuariosCriados,
          tiposUsuarios: Object.fromEntries(this.metrics.users.tiposUsuarios)
        }
      }));

    } catch (error) {
      this.logger.error(`❌ Erro ao registrar métricas de usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * ✅ Métricas de produtos
   */
  @OnEvent('produto.criado')
  async handleProdutoCriado(event: any): Promise<void> {
    try {
      this.metrics.products.produtosCriados++;
      
      const categoria = event.categoria || 'sem_categoria';
      const currentCount = this.metrics.products.categorias.get(categoria) || 0;
      this.metrics.products.categorias.set(categoria, currentCount + 1);

      this.logger.log(JSON.stringify({
        event: 'produto_criado',
        produtoId: event.aggregateId,
        categoria: categoria,
        estabelecimentoId: event.estabelecimentoId,
        timestamp: new Date().toISOString(),
        metrics: {
          totalProdutos: this.metrics.products.produtosCriados,
          categorias: Object.fromEntries(this.metrics.products.categorias)
        }
      }));

    } catch (error) {
      this.logger.error(`❌ Erro ao registrar métricas de produto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ===== HEALTH CHECK METRICS =====

  /**
   * ✅ Métricas de domínio para health check
   */
  getDomainMetrics() {
    return {
      sales: {
        pedidosCriados: this.metrics.sales.pedidosCriados,
        valorTotalPedidos: this.metrics.sales.valorTotalPedidos,
        itensVendidos: this.metrics.sales.itensVendidos,
        estabelecimentosAtivos: this.metrics.sales.estabelecimentos.size,
        ticketMedio: this.metrics.sales.pedidosCriados > 0 
          ? this.metrics.sales.valorTotalPedidos / this.metrics.sales.pedidosCriados 
          : 0
      },
      users: {
        usuariosCriados: this.metrics.users.usuariosCriados,
        tiposUsuarios: Object.fromEntries(this.metrics.users.tiposUsuarios)
      },
      products: {
        produtosCriados: this.metrics.products.produtosCriados,
        categorias: Object.fromEntries(this.metrics.products.categorias)
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * ✅ Reset métricas (útil para testes)
   */
  resetMetrics(): void {
    this.metrics = {
      sales: {
        pedidosCriados: 0,
        valorTotalPedidos: 0,
        itensVendidos: 0,
        estabelecimentos: new Set<string>()
      },
      users: {
        usuariosCriados: 0,
        tiposUsuarios: new Map<string, number>()
      },
      products: {
        produtosCriados: 0,
        categorias: new Map<string, number>()
      }
    };
  }

  /**
   * ✅ Incrementar métrica customizada
   */
  incrementCounter(domain: string, metric: string, value: number = 1): void {
    this.logger.log(JSON.stringify({
      event: 'custom_metric',
      domain,
      metric,
      value,
      timestamp: new Date().toISOString()
    }));
  }
}
