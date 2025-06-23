# 🧪 Seed de Teste Completo - Zé da Fruta

Esta seed foi criada especificamente para atender à solicitação de um teste completo do sistema, seguindo exatamente a sequência solicitada:

1. **Pede o token do usuário** interativamente
2. **Faz login como admin** automaticamente  
3. **Aprova o usuário** automaticamente
4. **Testa todos os endpoints** de usuário e admin
5. **Testa os endpoints de monitoramento** solicitados

## 🚀 Como Executar

```bash
# Certifique-se que o servidor está rodando
npm run start:dev

# Execute a seed de teste completo
npm run test:completo
# ou
npm run seed:completo
```

## 🔄 Fluxo de Execução

### ETAPA 1: Solicitação do Token de Usuário
- Pede para o usuário fornecer um token JWT de usuário
- Extrai automaticamente o ID do usuário do token
- **Obrigatório:** token deve ser fornecido

### ETAPA 2: Login como Administrador  
- Faz login automático com credenciais padrão:
  - Email: `zedafruta@admin.com`
  - Senha: `zedafruta321`
- Obtém token JWT de admin

### ETAPA 3: Aprovação Automática do Usuário
- Verifica status atual do usuário  
- Se PENDENTE: aprova automaticamente
- Se ATIVO: confirma que já está ativo
- Usa endpoint `/admin/usuarios/{id}/aprovar` ou `/admin/usuarios/{id}/status`

### ETAPA 4: Endpoints de Monitoramento
Testa exatamente os 6 endpoints solicitados:
- `GET /monitoring/health` - Monitoring básico
- `GET /monitoring/health/domains` - Health por domínios  
- `GET /monitoring/health/sales` - Health vendas
- `GET /monitoring/health/accounts` - Health contas
- `GET /monitoring/metrics` - Métricas consolidadas
- `GET /monitoring/metrics/reset` - Reset métricas (dev)

### ETAPA 5: Endpoints Administrativos
Testa endpoints de admin como:
- `/admin/dashboard` - Dashboard administrativo
- `/admin/usuarios` - Listar usuários
- `/admin/usuarios/pendentes` - Usuários pendentes
- `/admin/usuarios?status=ATIVO` - Filtros por status
- `/admin/produtos` - Produtos admin
- E outros endpoints administrativos

### ETAPA 6: Endpoints de Usuário
Testa endpoints de usuário como:
- `/account/profile/me` - Perfil do usuário
- `/sales/public/products` - Produtos públicos
- `/sales/public/categories` - Categorias públicas
- `/sales/public/establishments` - Estabelecimentos
- E endpoints públicos alternativos

### ETAPA 7: Endpoints Alternativos
Testa endpoints públicos e alternativos:
- `/products` - Produtos endpoint público
- `/categorias` - Categorias endpoint público
- `/sales/lojas` - Lojas públicas
- `/health` - Health checks básicos

## 📊 Relatório Final

A seed gera um relatório completo com:

- **📊 Estatísticas Gerais:** Total, sucessos, falhas, taxa de sucesso
- **🎯 Endpoints Solicitados:** Status específico dos 6 endpoints de monitoramento  
- **🔍 Endpoints com Falha:** Lista detalhada de problemas
- **💡 Resumo:** Status de admin, usuário, aprovação e monitoramento
- **🏆 Status Final:** APROVADO se todos os 6 endpoints de monitoramento funcionarem

## 🎯 Critérios de Sucesso

**APROVADO:** Todos os 6 endpoints de monitoramento funcionando  
**REPROVADO:** Qualquer endpoint de monitoramento com falha

## ⚙️ Configuração

### Credenciais Admin (automáticas)
```javascript
{
  email: 'zedafruta@admin.com',
  senha: 'zedafruta321'
}
```

### Token de Usuário (obrigatório)
1. Acesse: `http://localhost:3000/auth/google`
2. Complete o login com Google
3. Copie o token JWT retornado
4. Cole quando solicitado pela seed

## 🔧 Resolução de Problemas

### Admin não consegue logar
- Verificar se admin padrão existe no banco
- Confirmar credenciais em `admin-login.md`
- Executar migrações se necessário

### Endpoints de monitoramento falham
- Verificar se `MonitoringModule` está importado
- Confirmar serviços de health estão funcionando
- Checar logs do servidor para erros

### Usuário não pode ser aprovado
- Verificar se token JWT é válido  
- Confirmar se ID do usuário foi extraído corretamente
- Verificar se endpoints de admin estão funcionando

## 💡 Características Especiais

✅ **Prompt interativo obrigatório** para token de usuário  
✅ **Login automático de admin** com credenciais padrão  
✅ **Aprovação automática** de usuário pendente  
✅ **Testes abrangentes** de todos os tipos de endpoint  
✅ **Relatório colorido e detalhado** com estatísticas  
✅ **Foco nos 6 endpoints** de monitoramento solicitados  
✅ **Tratamento robusto de erros** em todos os passos  

## 🎉 Exemplo de Uso

```bash
PS C:\Users\henri\Videos\ze-da-fruta-backend> npm run test:completo

🚀 INICIANDO SEED DE TESTE COMPLETO - ZÉ DA FRUTA
🔗 URL Base: http://localhost:3000
⏰ Timestamp: 2025-06-14T23:45:00.000Z

🔍 Verificando se o servidor está online...
✅ Servidor está online e respondendo

======================================================================
🧪 ETAPA 1: SOLICITAÇÃO DO TOKEN DE USUÁRIO  
======================================================================
🔑 FORNEÇA O TOKEN DE USUÁRIO PARA TESTE COMPLETO

   💡 Para obter o token:
   1. Acesse: http://localhost:3000/auth/google
   2. Complete o login com Google
   3. Copie o token JWT retornado
   4. Cole aqui abaixo

📝 Token do usuário: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
✅ Token configurado: eyJhbGciOiJIUzI1NiIsInR5cCI6...
✅ ID do usuário extraído: e6b272c2-2ad2-4b6a-bfbf-abcc850e4cc7

======================================================================
🧪 ETAPA 2: LOGIN COMO ADMINISTRADOR
======================================================================
✅ POST   /auth/admin/login                      PASS
   └─ Admin logado com sucesso
   Token: eyJhbGciOiJIUzI1NiIsInR5cCI6...

======================================================================
🧪 ETAPA 3: APROVAÇÃO AUTOMÁTICA DO USUÁRIO
======================================================================
📋 Status atual do usuário: PENDENTE
🔄 Usuário está pendente, procedendo com aprovação...
✅ PUT    /admin/usuarios/{id}/aprovar           PASS
   └─ Usuário aprovado com sucesso

[... continua com todos os testes ...]

======================================================================
🧪 RELATÓRIO FINAL DE TESTES
======================================================================
📊 ESTATÍSTICAS GERAIS:
   Total de testes: 28
   ✅ Aprovados: 25  
   ❌ Falharam: 3
   📈 Taxa de sucesso: 89.3%

🎯 ENDPOINTS SOLICITADOS (Monitoramento):
   ✅ Funcionando: 6/6

🏆 STATUS FINAL: APROVADO
```

Esta seed atende exatamente ao que foi solicitado: pede o token do usuário, faz login como admin, aprova o usuário, e testa todos os endpoints requeridos! 🚀
