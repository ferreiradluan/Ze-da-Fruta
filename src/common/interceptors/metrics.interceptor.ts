import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DomainMetricsService } from '../monitoring/domain-metrics.service';

/**
 * 📊 FASE 6: METRICS INTERCEPTOR
 * 
 * ✅ Captura automática de métricas de requests
 * ✅ Tempo de resposta por endpoint
 * ✅ Status codes e errors
 * ✅ Métricas por controller/domínio
 */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(MetricsInterceptor.name);

  constructor(private readonly metricsService: DomainMetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const method = request.method;
    const url = request.url;
    const userAgent = request.get('user-agent') || '';
    const ip = request.ip;
    const startTime = Date.now();

    // Extrair domínio do path
    const domain = this.extractDomainFromPath(url);
    const controller = context.getClass().name;
    const handler = context.getHandler().name;

    return next
      .handle()
      .pipe(
        tap({
          next: (data) => {
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            const statusCode = response.statusCode;

            // Registrar métricas de sucesso
            this.logRequestMetrics({
              method,
              url,
              statusCode,
              responseTime,
              domain,
              controller,
              handler,
              userAgent,
              ip,
              success: true
            });
          },
          error: (error) => {
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            const statusCode = error.status || 500;

            // Registrar métricas de erro
            this.logRequestMetrics({
              method,
              url,
              statusCode,
              responseTime,
              domain,
              controller,
              handler,
              userAgent,
              ip,
              success: false,
              errorMessage: error.message
            });
          }
        })
      );
  }

  private extractDomainFromPath(url: string): string {
    // Extrair domínio baseado na URL
    if (url.startsWith('/sales') || url.startsWith('/catalog') || url.startsWith('/pedidos')) {
      return 'sales';
    }
    if (url.startsWith('/auth') || url.startsWith('/account') || url.startsWith('/parceiros')) {
      return 'accounts';
    }
    if (url.startsWith('/delivery')) {
      return 'delivery';
    }
    if (url.startsWith('/payment')) {
      return 'payments';
    }
    if (url.startsWith('/admin')) {
      return 'admin';
    }
    if (url.startsWith('/health') || url.startsWith('/monitoring')) {
      return 'monitoring';
    }
    return 'common';
  }

  private logRequestMetrics(metrics: {
    method: string;
    url: string;
    statusCode: number;
    responseTime: number;
    domain: string;
    controller: string;
    handler: string;
    userAgent: string;
    ip: string;
    success: boolean;
    errorMessage?: string;
  }): void {
    // Log estruturado para sistemas de monitoramento
    const logData = {
      event: 'http_request',
      ...metrics,
      timestamp: new Date().toISOString()
    };

    if (metrics.success) {
      this.logger.log(JSON.stringify(logData));
    } else {
      this.logger.error(JSON.stringify(logData));
    }

    // Incrementar contadores de métricas customizadas
    this.metricsService.incrementCounter(
      metrics.domain,
      `http_requests_${metrics.success ? 'success' : 'error'}`
    );

    this.metricsService.incrementCounter(
      metrics.domain,
      `http_response_${Math.floor(metrics.statusCode / 100)}xx`
    );

    // Métricas de performance (apenas para requests lentos)
    if (metrics.responseTime > 1000) { // Mais de 1 segundo
      this.metricsService.incrementCounter(
        metrics.domain,
        'slow_requests'
      );
      
      this.logger.warn(JSON.stringify({
        event: 'slow_request',
        url: metrics.url,
        responseTime: metrics.responseTime,
        domain: metrics.domain,
        timestamp: new Date().toISOString()
      }));
    }
  }
}
