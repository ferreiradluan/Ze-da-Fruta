# Build stage
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Configure npm
RUN npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm config set registry https://registry.npmjs.org/ \
    && npm cache clean --force

# Install dependencies with specific flags
RUN npm ci --prefer-offline --no-audit --progress=false \
    && npm install -g @nestjs/cli@latest

# Copy source code
COPY . .

# Copy test files and configs
COPY ./test ./test

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Create uploads directory
RUN mkdir -p uploads && chown -R node:node uploads

# Use non-root user
USER node

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start:prod"]