# 📊 FASE 6: SISTEMA DE MONITORING E MÉTRICAS - GUIA COMPLETO

## 🎯 Visão Geral

Sistema completo de observabilidade implementado com:
- **Métricas por domínio** baseadas em eventos de negócio
- **Health checks** detalhados por módulo
- **Monitoramento de sistema** (CPU, memória, performance)
- **Endpoints públicos** para integração com ferramentas externas
- **Formato Prometheus** para dashboards Grafana

## 🚀 Como Testar

### 1. **Iniciar a Aplicação**
```bash
npm run start:dev
```

### 2. **Executar Testes de Métricas**
```bash
node scripts/test-metrics.js
```

### 3. **Verificar Endpoints Manualmente**
```bash
# Health check rápido (para load balancers)
curl http://localhost:3000/health

# Health check detalhado por domínios
curl http://localhost:3000/health/detailed

# Métricas de domínio
curl http://localhost:3000/health/metrics

# Métricas de sistema
curl http://localhost:3000/health/system

# Formato Prometheus
curl http://localhost:3000/health/prometheus

# Endpoints do monitoring controller
curl http://localhost:3000/monitoring/health
curl http://localhost:3000/monitoring/metrics
```

## 📊 Estrutura de Métricas

### **Sales Domain**
```json
{
  "sales": {
    "pedidosCriados": 150,
    "valorTotalPedidos": 4500.50,
    "itensVendidos": 320,
    "estabelecimentosAtivos": 25,
    "ticketMedio": 30.00
  }
}
```

### **Users Domain**
```json
{
  "users": {
    "usuariosCriados": 85,
    "tiposUsuarios": {
      "cliente": 75,
      "lojista": 10
    }
  }
}
```

### **Products Domain**
```json
{
  "products": {
    "produtosCriados": 200,
    "categorias": {
      "frutas": 80,
      "verduras": 60,
      "bebidas": 60
    }
  }
}
```

## 🏥 Health Checks

### **Status Codes**
- `up` - Funcionando normalmente
- `warning` - Funcionando com alertas
- `down` - Com problemas críticos

### **Thresholds Configurados**
- **Sales**: Máximo 1000 pedidos pendentes
- **Products**: Máximo 50 produtos sem estoque
- **Users**: Máximo 10% usuários suspensos
- **System**: Máximo 80% uso de memória

## 📈 Integração com Ferramentas

### **Prometheus**
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'ze-da-fruta'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/health/prometheus'
    scrape_interval: 30s
```

### **Grafana Dashboard**
1. Importar métricas do endpoint `/health/metrics`
2. Configurar alertas baseados nos thresholds
3. Criar dashboards por domínio de negócio

### **Load Balancer Health Check**
```yaml
health_check:
  path: /health
  interval: 30s
  timeout: 5s
  healthy_threshold: 2
  unhealthy_threshold: 3
```

## 🔧 Arquitetura Implementada

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Applications  │    │   Monitoring    │    │   External      │
│                 │    │   Services      │    │   Systems       │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ Controllers     │───▶│ MetricsService  │───▶│ Prometheus      │
│ Services        │    │ HealthService   │    │ Grafana         │
│ Events          │    │ Interceptors    │    │ AlertManager    │
│ Middleware      │    │ Middleware      │    │ ELK Stack       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Componentes Principais**

1. **DomainMetricsService** - Coleta métricas via eventos
2. **DomainHealthService** - Health checks por domínio
3. **MetricsInterceptor** - Métricas automáticas de HTTP
4. **SystemMetricsMiddleware** - Métricas de sistema
5. **HealthController** - Endpoints públicos
6. **MonitoringController** - Endpoints de monitoramento

## 📋 Logs Estruturados

### **Formato de Log de Evento**
```json
{
  "event": "pedido_criado",
  "pedidoId": "abc123",
  "clienteId": "user456",
  "valorTotal": 25.50,
  "quantidadeItens": 3,
  "timestamp": "2025-06-14T10:30:00Z",
  "metrics": {
    "totalPedidos": 151,
    "valorAcumulado": 4526.00
  }
}
```

### **Formato de Log de Sistema**
```json
{
  "event": "http_request",
  "requestId": "req_789xyz",
  "method": "POST",
  "url": "/sales/cart/checkout",
  "statusCode": 201,
  "responseTime": 145,
  "memory": {
    "heapUsed": 45,
    "heapTotal": 128
  },
  "timestamp": "2025-06-14T10:30:00Z"
}
```

## 🚨 Sistema de Alertas

### **Alertas Automáticos**
- Uso alto de memória (>500MB)
- Requests lentos (>2s)
- Erros de servidor (5xx)
- Thresholds de domínio ultrapassados

### **Formato de Alerta**
```json
{
  "event": "system_alerts",
  "requestId": "req_123",
  "alerts": [
    {
      "type": "HIGH_MEMORY_USAGE",
      "value": 550,
      "threshold": 500,
      "unit": "MB"
    }
  ],
  "timestamp": "2025-06-14T10:30:00Z"
}
```

## 🎯 Próximos Passos (Opcional)

1. **Dashboards Grafana** - Criar dashboards visuais
2. **Alerting Avançado** - Integrar com Slack/Teams
3. **APM Integration** - New Relic, DataDog, etc.
4. **Distributed Tracing** - OpenTelemetry
5. **Custom Metrics** - Métricas específicas do negócio

## ⚙️ Configuração de Produção

### **Environment Variables**
```bash
# Monitoring
METRICS_ENABLED=true
HEALTH_CHECK_ENABLED=true
SYSTEM_METRICS_ENABLED=true

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_STRUCTURED=true

# Alerting
ALERT_MEMORY_THRESHOLD=500
ALERT_RESPONSE_TIME_THRESHOLD=2000
ALERT_WEBHOOK_URL=https://hooks.slack.com/...
```

### **Performance Considerations**
- Métricas são mantidas em memória para performance
- Logs estruturados para facilitar parsing
- Endpoints de health são públicos (sem autenticação)
- Middleware otimizado para baixo overhead

## ✅ Benefícios Implementados

- **Observabilidade Completa** - Visibilidade de todas as operações
- **Alertas Inteligentes** - Baseados em KPIs de negócio
- **Performance Optimization** - Identificação de bottlenecks
- **Compliance e Auditoria** - Logs estruturados para auditoria
- **Escalabilidade** - Preparado para integração com ferramentas externas

---

**🎉 FASE 6 CONCLUÍDA COM SUCESSO!**

Sistema agora tem observabilidade completa e está pronto para produção!
