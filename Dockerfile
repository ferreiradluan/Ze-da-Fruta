# Build stage
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Configure npm
RUN npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm config set registry https://registry.npmjs.org/ \
    && npm cache clean --force

# Install dependencies
RUN npm ci --prefer-offline --no-audit --progress=false && npm install -g @nestjs/cli@latest && npm install sqlite3 --save

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /usr/src/app

# Copy only necessary files from builder
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./

# Create uploads directory
RUN mkdir -p uploads && chown -R node:node uploads

USER node
EXPOSE 3000
CMD ["node", "dist/main"]
