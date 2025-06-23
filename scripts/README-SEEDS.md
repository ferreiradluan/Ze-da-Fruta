# 🧪 Seeds de Teste de Endpoints

Este diretório contém scripts de teste automatizados para validar o funcionamento de todos os endpoints específicos de cada tipo de usuário no sistema Zé da Fruta.

## 📁 Scripts Disponíveis

### 🏪 Seed de Vendedor/Parceiro
**Arquivo:** `seed-vendedor-endpoints.js`

Testa todos os endpoints específicos de vendedores/parceiros:
- `/partner/dashboard/*` - Dashboard e resumos
- `/partner/products/*` - Gestão de produtos
- `/partner/orders/*` - Gestão de pedidos
- `/address/*` - Gestão de endereços (compartilhado)
- `/account/profile/me` - Perfil do usuário

**Taxa de Sucesso:** 100% (20/20 endpoints)

### 🚚 Seed de Entregador
**Arquivo:** `seed-entregador-endpoints.js`

Testa todos os endpoints específicos de entregadores:
- `/delivery/entregas/disponiveis` - Entregas disponíveis
- `/delivery/entregas/{id}/aceitar` - Aceitar entrega
- `/delivery/entregas/{id}/status` - Atualizar status da entrega
- `/delivery/pedidos/{pedidoId}/status` - Consultar status por pedido
- `/address/*` - Gestão de endereços (compartilhado)
- `/account/profile/me` - Perfil do usuário
- `/catalog/*` - Catálogo público (categorias, produtos, estabelecimentos)

**Taxa de Sucesso:** 100% (14/14 endpoints)

## 🚀 Como Usar

### Pré-requisitos
1. Servidor rodando em `http://localhost:3000`
2. Admin configurado com credenciais:
   - Email: `zedafruta@admin.com`
   - Senha: `zedafruta321`

### Executando as Seeds

#### Para Vendedor:
```bash
node scripts/seed-vendedor-endpoints.js
```

#### Para Entregador:
```bash
node scripts/seed-entregador-endpoints.js
```

### Processo de Teste

1. **Solicitação de Token**: O script pedirá o token JWT do usuário
   - Acesse o endpoint de auth apropriado (`/auth/vendedor` ou `/auth/entregador`)
   - Complete o login com Google
   - Copie APENAS o token JWT da URL (sem parâmetros extras)

2. **Aprovação Automática**: O script faz login como admin e aprova o usuário automaticamente

3. **Execução de Testes**: Testa todos os endpoints específicos do tipo de usuário

4. **Relatório Final**: Mostra estatísticas detalhadas e resultados por endpoint

## 📊 Tipos de Teste

### ✅ Testes de Sucesso
- **200-299**: Endpoint funciona corretamente
- **404**: Endpoint funcional, recurso não encontrado (esperado para IDs de teste)

### ❌ Testes de Falha
- **401**: Não autorizado (problema de autenticação)
- **403**: Proibido (problema de permissões)
- **500**: Erro interno do servidor

## 🔧 Funcionalidades

### Recursos das Seeds
- ✅ **Login Automático de Admin** para aprovação
- ✅ **Limpeza Automática de Tokens** (remove parâmetros extras)
- ✅ **Testes Abrangentes** de todos os endpoints específicos
- ✅ **Relatórios Detalhados** com estatísticas de sucesso
- ✅ **Cores no Console** para melhor visualização
- ✅ **Tratamento de Erros** robusto
- ✅ **Simulação de Dados** para testes de endpoints

### Endpoints Testados por Tipo

#### 🏪 Vendedor/Parceiro (20 endpoints):
- Dashboard principal e resumos
- Gestão de produtos (criar, listar, atualizar, remover)
- Gestão de pedidos (listar, atualizar status)
- Gestão de endereços (CRUD completo)
- Perfil do usuário
- Acesso a categorias (admin)
- Endpoints públicos de estabelecimentos

#### 🚚 Entregador (14 endpoints):
- Entregas disponíveis
- Aceitar entregas
- Atualizar status de entregas
- Consultar status por pedido
- Gestão de endereços (CRUD completo)
- Perfil do usuário
- Catálogo público (categorias, produtos, estabelecimentos)

## 🎯 Objetivos das Seeds

1. **Validação Funcional**: Garantir que todos os endpoints específicos funcionam
2. **Teste de Permissões**: Verificar que cada tipo de usuário acessa apenas seus endpoints
3. **Integração Completa**: Testar o fluxo completo desde autenticação até execução
4. **Monitoramento de Saúde**: Identificar rapidamente problemas nos endpoints
5. **Documentação Viva**: Servir como documentação dos endpoints disponíveis

## 📝 Logs e Debugging

As seeds geram logs coloridos detalhados:
- 🟢 **Verde**: Testes bem-sucedidos
- 🔴 **Vermelho**: Falhas em testes
- 🟡 **Amarelo**: Avisos e informações importantes
- 🔵 **Azul/Ciano**: Informações gerais e instruções

## 🔄 Atualizações

As seeds devem ser atualizadas sempre que:
- Novos endpoints forem adicionados
- Estruturas de resposta mudarem
- Novas permissões forem implementadas
- Novos tipos de usuário forem criados

## 📈 Histórico de Versões

### v2.0 - Vendedor (Atual)
- 100% de sucesso (20/20 endpoints)
- Correção de bugs de roles e JWT
- Melhoria na limpeza de tokens

### v1.0 - Entregador (Atual)
- 100% de sucesso (14/14 endpoints)
- Endpoints específicos de delivery
- Acesso a catálogo público
- Gestão completa de endereços
