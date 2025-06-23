# 🧪 Seed de Testes - Zé da Fruta Backend

Este diretório contém scripts de teste automatizados para validar todos os endpoints do sistema.

## 📋 Scripts Disponíveis

### 🎯 Teste Específico de Monitoramento
```bash
npm run test:monitoring
# ou
npm run seed:test
```

**Endpoints testados:**
- `GET /monitoring/health` - Monitoring básico
- `GET /monitoring/health/domains` - Health por domínios  
- `GET /monitoring/health/sales` - Health vendas
- `GET /monitoring/health/accounts` - Health contas
- `GET /monitoring/metrics` - Métricas consolidadas
- `GET /monitoring/metrics/reset` - Reset métricas (dev)

### 🔍 Teste Completo de Endpoints
```bash
npm run test:endpoints
# ou
npm run seed:complete
```

**Testa todos os endpoints:**
- Monitoramento e Health checks
- Endpoints administrativos  
- Endpoints de usuário
- Endpoints públicos
- Processo de aprovação de usuário

## 🚀 Como Usar

### 1. Preparação
```bash
# Certifique-se que o servidor está rodando
npm run start:dev

# Em outro terminal, execute os testes
npm run test:monitoring
```

### 2. Login Automático
O script faz login automático como admin usando as credenciais padrão:
- **Email:** `zedafruta@admin.com`
- **Senha:** `zedafruta321`

### 3. Token de Usuário (Opcional)
Para testes completos de usuário:

1. Acesse: http://localhost:3000/auth/google
2. Complete o login com Google
3. Copie o token JWT do callback
4. Cole quando solicitado pelo script

## 📊 Relatórios

Os scripts geram relatórios detalhados com:

- ✅ **Estatísticas gerais** (total, sucessos, falhas)
- 🎯 **Status dos endpoints solicitados**
- ❌ **Lista de endpoints com problemas**
- 💡 **Recomendações para correções**
- 🏆 **Status final** (APROVADO/REPROVADO)

## 🔧 Resolução de Problemas

### Servidor não responde
```bash
# Verifique se o servidor está rodando
npm run start:dev

# Ou verifique a porta
curl http://localhost:3000/health
```

### Falha no login de admin
1. Verifique se o admin padrão foi criado
2. Confirme as credenciais em `admin-login.md`
3. Execute as migrações se necessário

### Endpoints de monitoramento falhando
1. Verifique se todos os módulos estão importados
2. Confirme que o `MonitoringModule` está configurado
3. Verifique logs do servidor para erros específicos

## 📁 Estrutura dos Scripts

```
scripts/
├── test-monitoring-seed.js     # Teste específico de monitoramento
└── test-complete-endpoints.js  # Teste completo de todos endpoints
```

## 🎯 Endpoints Principais Testados

### Monitoramento
- `/monitoring/health` - Health check básico
- `/monitoring/health/domains` - Health detalhado por domínios
- `/monitoring/health/sales` - Health específico do domínio de vendas
- `/monitoring/health/accounts` - Health específico do domínio de contas
- `/monitoring/metrics` - Métricas consolidadas dos domínios
- `/monitoring/metrics/reset` - Reset das métricas (desenvolvimento)

### Health Alternativos
- `/health` - Health check rápido
- `/health/detailed` - Health check detalhado
- `/health/metrics` - Métricas de domínio
- `/health/system` - Métricas de sistema

### Administrativos
- `/admin/dashboard` - Dashboard administrativo
- `/admin/usuarios` - Gestão de usuários
- `/admin/usuarios/pendentes` - Usuários aguardando aprovação
- `/admin/usuarios/{id}/aprovar` - Aprovação de usuários
- `/admin/products` - Gestão de produtos

### Usuário
- `/account/profile/me` - Perfil do usuário
- `/sales/public/products` - Produtos públicos
- `/sales/public/categories` - Categorias públicas

## 🏆 Critérios de Sucesso

**APROVADO:** Todos os 6 endpoints de monitoramento solicitados funcionando
**REPROVADO:** Qualquer endpoint de monitoramento com falha

## 💡 Dicas

1. **Execute sempre com o servidor rodando**
2. **Aguarde o admin padrão ser criado automaticamente**
3. **Use um token de usuário válido para testes completos**
4. **Verifique os logs do servidor se houver falhas**
5. **Os testes incluem pequenas pausas para evitar sobrecarga**

## 🔄 Execução Contínua

Para monitoramento contínuo durante desenvolvimento:

```bash
# Terminal 1: Servidor
npm run start:dev

# Terminal 2: Testes (executar quando necessário)
npm run test:monitoring
```
