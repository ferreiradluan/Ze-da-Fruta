# Escolhe uma imagem oficial do Node.js
FROM node:20-alpine AS builder

# Define o diretório de trabalho dentro do container
WORKDIR /usr/src/app

# Copia os arquivos de dependências
COPY package*.json ./

# Instala as dependências do projeto
RUN npm install
RUN npm install sqlite3 --save

# Copia o restante do código da aplicação
COPY . .

# Compila o projeto TypeScript
RUN npm run build

# --- STAGE 2: Production ---
FROM node:20-alpine

WORKDIR /usr/src/app

# Copia os arquivos de dependências
COPY package*.json ./

# Instala as dependências do projeto
RUN npm install --only=production && npm install sqlite3 --only=production

# Copia os arquivos compilados da imagem de build
COPY --from=builder /usr/src/app/dist ./dist

# Expõe a porta que a aplicação irá rodar
EXPOSE 3000

# Comando para iniciar a aplicação
CMD [ "node", "dist/main" ]
