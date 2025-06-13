# 🍎 Ze da Fruta - Backend

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-20.x-green)
![NestJS](https://img.shields.io/badge/NestJS-10.x-red)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![SQLite](https://img.shields.io/badge/SQLite-3.x-lightblue)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

**Sistema de delivery de hortifrúti desenvolvido com NestJS**

[Documentação da API](#-documentação-da-api) • [Instalação](#-instalação) • [Deploy](#-deploy) • [Contribuidores](#-contribuidores)

</div>

---

## 🌐 Deploy em Produção

<div align="center">

### 🚀 **Aplicação Online**
**API Backend:** [https://meu-ze-da-fruta-backend-8c4976f28553.herokuapp.com](https://meu-ze-da-fruta-backend-8c4976f28553.herokuapp.com)

### 📚 **Documentação Swagger**
**Interface Interativa:** [https://meu-ze-da-fruta-backend-8c4976f28553.herokuapp.com/api#/](https://meu-ze-da-fruta-backend-8c4976f28553.herokuapp.com/api#/)

![Heroku](https://img.shields.io/badge/Heroku-Deployed-purple)
![API Status](https://img.shields.io/badge/API-Online-brightgreen)

</div>

---

## 📋 Sobre o Projeto

O **Ze da Fruta** é uma plataforma completa de delivery de hortifrúti que conecta consumidores, parceiros comerciais e administradores em um ecossistema digital robusto. O backend foi desenvolvido utilizando as melhores práticas de arquitetura de software, oferecendo uma API RESTful escalável e segura.

### 🚀 Funcionalidades Principais

- **🔐 Autenticação Completa**: JWT + Google OAuth 2.0
- **👥 Gestão Multi-usuário**: Clientes, Parceiros e Administradores
- **🏪 Gestão de Estabelecimentos**: CRUD completo para lojas parceiras
- **📦 Sistema de Pedidos**: Fluxo completo do carrinho à entrega
- **💳 Integração de Pagamentos**: Stripe para processamento seguro
- **📱 API RESTful**: Documentação OpenAPI/Swagger
- **🐳 Containerização**: Docker para deploy simplificado
- **🎯 Event-Driven Architecture**: Sistema de eventos para notificações

---

## 🛠️ Tecnologias Utilizadas

| Categoria | Tecnologias |
|-----------|-------------|
| **Framework** | NestJS, Express.js |
| **Linguagem** | TypeScript |
| **Banco de Dados** | SQLite, TypeORM |
| **Autenticação** | JWT, Passport, Google OAuth 2.0 |
| **Pagamentos** | Stripe API |
| **Documentação** | Swagger/OpenAPI |
| **Containerização** | Docker, Docker Compose |
| **Validação** | Class Validator, Class Transformer |

---

## 🚀 Instalação

### 📋 Pré-requisitos

- **Node.js** 20.x ou superior
- **Docker** e **Docker Compose**
- **Git**
- Conta no **Google Cloud Console** (para OAuth)
- Conta no **Stripe** (para pagamentos)

### 🔧 Configuração do Ambiente

1. **Clone o repositório:**
```bash
git clone https://github.com/ferreiradluan/Ze-da-Fruta.git
cd ze-da-fruta-backend
```

2. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env
```

3. **Atualize o arquivo `.env`:**
```env
NODE_ENV=development
PORT=3000
JWT_SECRET=seu-jwt-secret-super-seguro
JWT_EXPIRATION=7d
GOOGLE_CLIENT_ID=seu-google-client-id
GOOGLE_CLIENT_SECRET=seu-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
DATABASE_URL=./db/database.sqlite
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 🐳 Executando com Docker (Recomendado)

```bash
# Construir e iniciar os containers
docker-compose up --build

# Em modo detached (background)
docker-compose up -d --build
```

### 💻 Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Executar migrações do banco
npm run migration:run

# Executar seeds (dados iniciais)
npm run seed

# Iniciar em modo desenvolvimento
npm run start:dev
```

A aplicação estará disponível em `http://localhost:3000`

---

## 🔧 Variáveis de Ambiente

As seguintes variáveis são necessárias:

- `NODE_ENV`: Ambiente da aplicação (development/production)
- `PORT`: Porta da aplicação (padrão: 3000)
- `JWT_SECRET`: Chave secreta para geração de tokens JWT
- `JWT_EXPIRATION`: Tempo de expiração do token JWT
- `GOOGLE_CLIENT_ID`: Client ID do Google OAuth
- `GOOGLE_CLIENT_SECRET`: Client Secret do Google OAuth
- `GOOGLE_CALLBACK_URL`: URL de callback do Google OAuth
- `DATABASE_URL`: URL de conexão com o banco de dados
- `FRONTEND_URL`: URL do frontend permitido no CORS
- `CORS_ORIGIN`: Origem permitida para CORS
- `STRIPE_SECRET_KEY`: Chave secreta da API Stripe
- `STRIPE_WEBHOOK_SECRET`: Chave do webhook Stripe

Veja `.env.example` para todos os exemplos.

---

## 📚 Documentação da API

### 🌐 Swagger UI

Acesse a documentação interativa da API em:
```
http://localhost:3000/api
```

### 🔑 Endpoints Principais

| Módulo | Endpoint | Descrição |
|--------|----------|-----------|
| **Auth** | `POST /auth/login` | Login com email/senha |
| **Auth** | `GET /auth/google` | Login com Google OAuth |
| **Admin** | `GET /admin/usuarios` | Listar todos os usuários |
| **Admin** | `PUT /admin/usuarios/{id}/status` | Alterar status do usuário |
| **Pedidos** | `POST /pedidos` | Criar novo pedido |
| **Pedidos** | `GET /pedidos` | Listar pedidos do usuário |
| **Produtos** | `GET /produtos` | Listar produtos disponíveis |

### 📖 Exemplos de Uso

Consulte os arquivos na pasta [`tests-http/`](./tests-http/) para exemplos práticos de requisições HTTP.

---

## 🏗️ Arquitetura do Sistema

```
src/
├── 1-account-management/     # Gestão de contas e usuários
├── 2-product-catalog/        # Catálogo de produtos
├── 3-order-management/       # Gestão de pedidos
├── 4-payment-processing/     # Processamento de pagamentos
├── 5-delivery-tracking/      # Rastreamento de entregas
├── auth/                     # Autenticação e autorização
├── common/                   # Utilitários compartilhados
├── database/                 # Configurações do banco
└── main.ts                   # Ponto de entrada
```

### 🔄 Fluxo de Dados

1. **Autenticação** → JWT Token gerado
2. **Catálogo** → Produtos carregados por estabelecimento
3. **Pedido** → Carrinho → Checkout → Pagamento
4. **Processamento** → Stripe → Confirmação
5. **Entrega** → Notificações → Rastreamento

---

## 🚀 Deploy

### 🌐 Heroku (Produção)

```bash
# Login no Heroku
heroku login

# Criar aplicação
heroku create seu-app-name

# Configurar variáveis de ambiente
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=seu-jwt-secret-producao

# Deploy
git push heroku main
```

### 🐳 Docker em Produção

```bash
# Build da imagem
docker build -t ze-da-fruta-backend:latest .

# Executar container
docker run -p 3000:3000 --env-file .env ze-da-fruta-backend:latest
```

---

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes e2e
npm run test:e2e

# Coverage
npm run test:cov
```

---

## 🔒 Segurança

- ✅ **Variáveis sensíveis** não versionadas
- ✅ **Autenticação JWT** com expiração configurável
- ✅ **Google OAuth 2.0** para login social
- ✅ **Validação de dados** em todas as rotas
- ✅ **CORS** configurado adequadamente
- ✅ **Rate limiting** implementado
- ✅ **Sanitização** de inputs do usuário

---

## 🤝 Contribuidores

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/ferreiradluan">
        <img src="https://github.com/ferreiradluan.png" width="100px;" alt="Luan Ferreira"/>
        <br />
        <sub><b>Luan Ferreira</b></sub>
        <br />
        <sub>UC23200704</sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/tiagoaschulz">
        <img src="https://github.com/tiagoaschulz.png" width="100px;" alt="Tiago Schulz"/>
        <br />
        <sub><b>Tiago Schulz</b></sub>
        <br />
        <sub>UC23200154</sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/vctrdavidsom">
        <img src="https://github.com/vctrdavidsom.png" width="100px;" alt="Victor Davidson"/>
        <br />
        <sub><b>Victor Davidson</b></sub>
        <br />
        <sub>UC23201064</sub>
      </a>
    </td>
  </tr>
</table>

---

## 📄 Licença

Este projeto está licenciado sob a **MIT License**. Consulte o arquivo [LICENSE](./LICENSE) para mais detalhes.

---

## 📞 Suporte

- 📧 **Email**: luanhsouzaf@gmail.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/ferreiradluan/Ze-da-Fruta/issues)
- 📖 **Wiki**: [Documentação Completa](https://github.com/ferreiradluan/Ze-da-Fruta/wiki)

---

<div align="center">
  <sub>Desenvolvido com ❤️ pela equipe Ze da Fruta</sub>
</div>
