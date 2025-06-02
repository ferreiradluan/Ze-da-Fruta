# Ze da Fruta - Backend

Este é o backend do aplicativo de delivery de hortifrúti chamado **Ze da Fruta**. O sistema foi desenvolvido em NestJS e fornece uma API RESTful para operações de cadastro, autenticação, pedidos, entregas e gerenciamento de produtos, usuários e estabelecimentos.

## 🚀 Primeiros Passos

### Pré-requisitos

- Docker e Docker Compose
- Node.js 20.x (para desenvolvimento local)
- npm ou yarn

### Configuração do Ambiente

1. Clone o repositório:
```bash
git clone <url-do-seu-repositorio>
cd nestjs-crud-app-2
```

2. Crie o arquivo de variáveis de ambiente:
```bash
cp .env.example .env
```

3. Atualize o arquivo `.env` com seus dados:
- Gere um JWT_SECRET seguro
- Configure as credenciais do Google OAuth no Google Cloud Console
- Atualize as demais variáveis conforme necessário

### Executando com Docker

1. Construa e inicie o container:
```bash
docker-compose up --build
```

A aplicação estará disponível em `http://localhost:3000`

### Desenvolvimento Local

1. Instale as dependências:
```bash
npm install
```

2. Inicie o servidor de desenvolvimento:
```bash
npm run start:dev
```

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

## 📝 Documentação da API

A documentação da API estará disponível em `http://localhost:3000/api` quando a aplicação estiver rodando.

## 🐳 Docker

A aplicação é containerizada utilizando Docker. O Dockerfile utiliza multi-stage build para otimizar o tamanho e a segurança da imagem.

### Build da Imagem

```bash
docker build -t ze-da-fruta-backend .
```

### Executando com Docker Compose

```bash
docker-compose up
```

## 🔍 Health Check

O endpoint `/health` pode ser utilizado para monitorar o status da aplicação.

## 📦 Estrutura do Projeto

```
nestjs-crud-app-2/
├── src/
│   ├── auth/           # Módulo de autenticação
│   ├── users/          # Módulo de usuários
│   ├── common/         # Utilitários e guards
│   └── main.ts         # Ponto de entrada da aplicação
├── test/               # Testes
├── migrations/         # Migrations do banco
├── Dockerfile          # Configuração Docker
├── docker-compose.yml  # Configuração Docker Compose
└── .env.example        # Exemplo de variáveis de ambiente
```

## 🔐 Segurança

- Variáveis de ambiente não são versionadas
- Autenticação via JWT
- Integração com Google OAuth
- Banco SQLite com permissões adequadas

## 📄 Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.
