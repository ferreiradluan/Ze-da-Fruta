# Domínio 2-sales (Vendas) - Implementação DDD

Este domínio implementa o módulo de vendas seguindo os padrões de Domain-Driven Design (DDD) e Rich Domain Model.

## 📋 Diagrama de Classes

O diagrama PlantUML está localizado em: `src/2-sales/diagrams/domain-diagram.puml`

## 🏗️ Arquitetura

### Camadas Implementadas

#### 1. **Camada de Domínio (Rich Domain Model)**
- **Entidades**: Contêm lógica de negócio rica
  - `Pedido`: Gerencia itens, cupons, cálculos e transições de status
  - `ItemPedido`: Calcula subtotais e gerencia quantidades
  - `Produto`: Controla estoque, disponibilidade e preços
  - `Estabelecimento`: Gerencia abertura/fechamento
  - `Cupom`: Valida e calcula descontos
  - `Categoria`: Agrupa produtos

- **Value Objects**:
  - `Dinheiro`: Encapsula valores monetários com validações

- **Enums**:
  - `StatusPedido`: Define estados do pedido conforme o diagrama

#### 2. **Camada de Aplicação (Services)**
- **SalesService**: Orquestra operações de venda
  - `criarPedido(clienteId, dadosSacola)`
  - `obterPedido(pedidoId, clienteId)`
  - `listarProdutosDeLoja(lojaId)`
  - `obterDetalhesProduto(produtoId)`
  - `aplicarCupomAoPedido(pedidoId, codigoCupom)`

#### 3. **Camada de Acesso a Dados (Repositories)**
- `PedidoRepository`: Persistência de pedidos
- `ProdutoRepository`: Acesso a produtos
- `EstabelecimentoRepository`: Dados de estabelecimentos
- `CupomRepository`: Gerenciamento de cupons

#### 4. **Camada de API (Controllers)**
- `PedidosController`: Endpoints de pedidos
- `ProdutosController`: Catálogo de produtos
- `LojasController`: Informações de estabelecimentos

## 🎯 Padrões DDD Implementados

### Rich Domain Model
- **Entidades com comportamentos**: As entidades não são apenas estruturas de dados, mas contêm métodos de negócio
- **Validações no domínio**: Regras de negócio são aplicadas nas próprias entidades
- **Encapsulamento**: Estado interno protegido com métodos específicos

### Value Objects
- **Dinheiro**: Encapsula valores monetários com operações seguras
- **Imutabilidade**: Value objects são imutáveis
- **Validações**: Contêm suas próprias regras de validação

### Repository Pattern
- **Separação de responsabilidades**: Lógica de acesso a dados isolada
- **Interface consistente**: Métodos padronizados para acesso a dados
- **Testabilidade**: Facilita mock e testes unitários

## 🔄 Fluxos de Negócio

### Criação de Pedido
```typescript
// 1. Cliente cria pedido
const pedido = await salesService.criarPedido(clienteId, dadosSacola);

// 2. Sistema usa métodos do domínio rico
pedido.adicionarItem(produto, quantidade);
pedido.aplicarCupom(cupom);
pedido.calcularTotal();

// 3. Pedido é persistido
await pedidoRepository.save(pedido);
```

### Gestão de Status
```typescript
// Estados seguindo o diagrama
enum StatusPedido {
  PAGAMENTO_PENDENTE,
  PAGO,
  EM_PREPARACAO,
  AGUARDANDO_ENTREGADOR,
  ENTREGUE,
  CANCELADO
}

// Transições controladas pelo domínio
pedido.confirmar(); // PAGAMENTO_PENDENTE -> PAGO
pedido.enviar();    // EM_PREPARACAO -> AGUARDANDO_ENTREGADOR
pedido.entregar();  // AGUARDANDO_ENTREGADOR -> ENTREGUE
```

## 🎨 Principais Funcionalidades

### Domínio Rico
- ✅ Validações de negócio nas entidades
- ✅ Cálculos automáticos de totais
- ✅ Controle de estoque
- ✅ Aplicação de cupons
- ✅ Transições de status controladas

### Value Objects
- ✅ `Dinheiro` com operações matemáticas seguras
- ✅ Formatação automática de moeda
- ✅ Validações de valores negativos

### Repositories
- ✅ Operações CRUD padronizadas
- ✅ Consultas específicas de domínio
- ✅ Relacionamentos carregados adequadamente

## 🔧 Métodos Principais do SalesService

Conforme especificado no diagrama:

1. **`criarPedido(clienteId, dadosSacola)`**: Cria pedido usando regras do domínio
2. **`obterPedido(pedidoId, clienteId)`**: Retorna pedido com validação de acesso
3. **`listarProdutosDeLoja(lojaId)`**: Lista produtos de estabelecimento específico
4. **`obterDetalhesProduto(produtoId)`**: Detalhes completos do produto
5. **`aplicarCupomAoPedido(pedidoId, codigoCupom)`**: Aplica desconto usando regras do cupom

## 📚 Benefícios da Implementação DDD

1. **Domínio Rico**: Lógica de negócio centralizada nas entidades
2. **Testabilidade**: Métodos de domínio facilmente testáveis
3. **Manutenibilidade**: Código organizado e responsabilidades claras
4. **Flexibilidade**: Fácil adaptação a mudanças de regras de negócio
5. **Expressividade**: Código que expressa claramente as regras de negócio

## 🚀 Próximos Passos

- [ ] Implementar eventos de domínio
- [ ] Adicionar mais validações de negócio
- [ ] Criar especificações para consultas complexas
- [ ] Implementar padrão CQRS se necessário
- [ ] Adicionar testes unitários para o domínio rico

---

Esta implementação segue fielmente o diagrama fornecido e aplica os padrões de DDD de forma consistente e prática.
