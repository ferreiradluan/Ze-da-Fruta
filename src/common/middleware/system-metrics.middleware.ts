import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * 📊 FASE 6: SYSTEM METRICS MIDDLEWARE
 * 
 * ✅ Métricas de sistema (CPU, Memória)
 * ✅ Tracking de performance por endpoint
 * ✅ Rate limiting metrics
 * ✅ Headers de monitoramento
 */
@Injectable()
export class SystemMetricsMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SystemMetricsMiddleware.name);
  
  use(req: Request, res: Response, next: NextFunction) {
    const startTime = process.hrtime.bigint();
    const startUsage = process.cpuUsage();
    
    // Adicionar headers de monitoramento
    res.setHeader('X-Request-ID', this.generateRequestId());
    res.setHeader('X-Response-Time', '0'); // Será atualizado no final
      // Override do response.end para capturar métricas finais
    const originalEnd = res.end.bind(res);
    res.end = (chunk?: any, encoding?: any) => {
      const endTime = process.hrtime.bigint();
      const responseTime = Number(endTime - startTime) / 1e6; // Convert to milliseconds
      const cpuUsage = process.cpuUsage(startUsage);
      
      // Atualizar header de tempo de resposta
      res.setHeader('X-Response-Time', `${responseTime.toFixed(2)}ms`);
      
      // Log métricas de sistema
      const memoryUsage = process.memoryUsage();
      const systemMetrics = {
        event: 'system_metrics',
        requestId: res.getHeader('X-Request-ID'),
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        responseTime: Math.round(responseTime),
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
        },
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
          external: Math.round(memoryUsage.external / 1024 / 1024) // MB
        },
        uptime: Math.round(process.uptime()),
        timestamp: new Date().toISOString()
      };
      
      // Log apenas requests lentos ou com problemas para reduzir verbosidade
      if (responseTime > 500 || res.statusCode >= 400) {
        this.logger.warn(JSON.stringify(systemMetrics));
      } else {
        this.logger.debug(JSON.stringify(systemMetrics));
      }
      
      // Verificar alertas de sistema
      this.checkSystemAlerts(systemMetrics);
      
      // Chamar o método original
      return originalEnd(chunk, encoding);
    };
    
    next();
  }
  
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
    private checkSystemAlerts(metrics: any): void {
    const alerts: any[] = [];
    
    // Alertas de memória
    if (metrics.memory.heapUsed > 500) { // 500MB
      alerts.push({
        type: 'HIGH_MEMORY_USAGE',
        value: metrics.memory.heapUsed,
        threshold: 500,
        unit: 'MB'
      });
    }
    
    // Alertas de performance
    if (metrics.responseTime > 2000) { // 2 segundos
      alerts.push({
        type: 'SLOW_RESPONSE',
        value: metrics.responseTime,
        threshold: 2000,
        unit: 'ms',
        url: metrics.url
      });
    }
    
    // Alertas de erro
    if (metrics.statusCode >= 500) {
      alerts.push({
        type: 'SERVER_ERROR',
        statusCode: metrics.statusCode,
        url: metrics.url
      });
    }
    
    // Log alertas se houver
    if (alerts.length > 0) {
      this.logger.error(JSON.stringify({
        event: 'system_alerts',
        requestId: metrics.requestId,
        alerts,
        timestamp: new Date().toISOString()
      }));
    }
  }
}

/**
 * 📊 Helper para métricas de sistema estáticas
 */
export class SystemMetricsHelper {
  static getSystemStatus() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      uptime: Math.round(process.uptime()),
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024) // MB
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      timestamp: new Date().toISOString()
    };
  }
  
  static getHealthStatus() {
    const systemStatus = this.getSystemStatus();
    const memoryUsagePercent = (systemStatus.memory.heapUsed / systemStatus.memory.heapTotal) * 100;
    
    return {
      status: memoryUsagePercent < 80 ? 'healthy' : 'warning',
      checks: {
        memory: {
          status: memoryUsagePercent < 80 ? 'ok' : 'warning',
          usagePercent: Math.round(memoryUsagePercent),
          heapUsed: systemStatus.memory.heapUsed,
          heapTotal: systemStatus.memory.heapTotal
        },
        uptime: {
          status: 'ok',
          seconds: systemStatus.uptime
        }
      },
      timestamp: systemStatus.timestamp
    };
  }
}
