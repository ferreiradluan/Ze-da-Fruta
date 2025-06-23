# 🧪 Sistema de Testes Automatizados - Zé da Fruta

## 📋 Resumo

Criamos um sistema completo de testes automatizados que:

✅ **Faz login automático como admin** usando credenciais padrão  
✅ **Solicita token de usuário** para testes completos  
✅ **Testa TODOS os endpoints** de monitoramento solicitados  
✅ **Aprova usuários automaticamente** via admin  
✅ **Gera relatórios detalhados** com estatísticas  
✅ **Valida o sistema completo** end-to-end  

## 🎯 Endpoints Específicos Testados

Conforme solicitado, o sistema testa exatamente estes endpoints:

```
GET /monitoring/health                   # Monitoring básico
GET /monitoring/health/domains           # Health por domínios
GET /monitoring/health/sales             # Health vendas
GET /monitoring/health/accounts          # Health contas
GET /monitoring/metrics                  # Métricas consolidadas
GET /monitoring/metrics/reset            # Reset métricas (dev)
```

## 🚀 Como Executar

### 1. Demonstração (Ver o que está disponível)
```bash
npm run test:demo
```

### 2. Teste Específico de Monitoramento  
```bash
npm run test:monitoring
# ou
npm run seed:test
```

### 3. Teste Completo do Sistema
```bash
npm run test:endpoints  
# ou
npm run seed:complete
```

## 🔄 Fluxo Completo

1. **Verificação do servidor** - Confirma que está online
2. **Login automático como admin** - Usa credenciais padrão
3. **Solicitação de token do usuário** - Para testes de usuário
4. **Teste dos endpoints de monitoramento** - Os 6 específicos
5. **Teste dos endpoints administrativos** - Dashboard, usuários, etc.
6. **Processo de aprovação** - Se usuário pendente, aprova automaticamente
7. **Teste dos endpoints de usuário** - Após aprovação
8. **Relatório final** - Com estatísticas e status

## 📊 Exemplo de Saída

```
🧪 STEP 1: AUTENTICAÇÃO ADMIN
═══════════════════════════════════════
✅ POST   /auth/admin/login                      
   └─ Admin logado com sucesso
   Token: eyJhbGciOiJIUzI1NiIs...

🧪 STEP 3: ENDPOINTS DE MONITORAMENTO  
═══════════════════════════════════════
✅ GET    /monitoring/health
   └─ Monitoring básico | Status: ok
✅ GET    /monitoring/health/domains
   └─ Health por domínios | Status: up
✅ GET    /monitoring/health/sales
   └─ Health vendas | Status: up
✅ GET    /monitoring/health/accounts
   └─ Health contas | Status: up
✅ GET    /monitoring/metrics
   └─ Métricas consolidadas | Pedidos: 0
✅ GET    /monitoring/metrics/reset
   └─ Reset métricas (dev)

📊 Resultado: 6/6 endpoints funcionando

🧪 RELATÓRIO FINAL
═══════════════════════════════════════
📈 ESTATÍSTICAS:
   Total de testes: 15
   ✅ Sucessos: 15
   ❌ Falhas: 0
   📊 Taxa de sucesso: 100.0%

🎯 ENDPOINTS SOLICITADOS:
   ✅ Funcionando: 6/6

🏆 STATUS FINAL: APROVADO
```

## 🛠️ Configuração Técnica

### Credenciais de Admin
```javascript
{
  email: 'zedafruta@admin.com',
  senha: 'zedafruta321'
}
```

### Dependências Adicionadas
- `axios` - Para requisições HTTP nos testes

### Scripts Criados
- `scripts/test-monitoring-seed.js` - Teste específico de monitoramento
- `scripts/test-complete-endpoints.js` - Teste completo do sistema
- `scripts/demo-tests.js` - Demonstração dos testes disponíveis
- `scripts/README-TESTS.md` - Documentação detalhada

### Scripts no package.json
```json
{
  "seed:test": "node scripts/test-monitoring-seed.js",
  "seed:complete": "node scripts/test-complete-endpoints.js", 
  "seed:demo": "node scripts/demo-tests.js",
  "test:monitoring": "node scripts/test-monitoring-seed.js",
  "test:endpoints": "node scripts/test-complete-endpoints.js",
  "test:demo": "node scripts/demo-tests.js"
}
```

## 🔧 Resolução de Problemas

### Servidor não responde
```bash
npm run start:dev
```

### Admin não consegue logar
1. Verificar se o admin padrão existe no banco
2. Executar migrações se necessário
3. Verificar credenciais em `admin-login.md`

### Endpoints de monitoramento falham
1. Confirmar que `MonitoringModule` está importado
2. Verificar se `DomainHealthService` e `DomainMetricsService` estão funcionando
3. Checar logs do servidor para erros específicos

## 💡 Funcionalidades Especiais

### ✅ Auto-Login como Admin
Usa as credenciais padrão automaticamente, sem necessidade de configuração manual.

### ✅ Prompt Interativo para Token de Usuário  
Solicita token de usuário de forma amigável, mas funciona mesmo sem ele.

### ✅ Aprovação Automática de Usuários
Se encontrar usuário pendente, o admin aprova automaticamente.

### ✅ Relatórios Coloridos e Detalhados
Output formatado com cores, ícones e estatísticas completas.

### ✅ Tratamento de Erros Robusto
Funciona mesmo se alguns endpoints falharem, sempre gera relatório.

### ✅ Pausa Entre Requests
Evita sobrecarga do servidor com pequenas pausas entre testes.

## 🎯 Critério de Sucesso

**APROVADO:** Todos os 6 endpoints de monitoramento funcionando  
**REPROVADO:** Qualquer endpoint de monitoramento com falha

## 🔄 Uso Recomendado

### Durante Desenvolvimento
```bash
# Terminal 1: Servidor
npm run start:dev

# Terminal 2: Testes quando necessário
npm run test:monitoring
```

### Antes de Deploy
```bash
npm run test:endpoints  # Teste completo
```

### Para Demonstração
```bash
npm run test:demo       # Ver instruções
npm run test:monitoring # Executar teste
```

O sistema está pronto para uso e testará exatamente os endpoints solicitados! 🚀
