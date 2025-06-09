import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/exceptions/http-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import helmet from 'helmet';
import { getSecurityConfig } from './common/config/security.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true, // Habilitar raw body para webhooks
  });
  
  // Get configuration service
  const configService = app.get(ConfigService);
  const securityConfig = getSecurityConfig(configService);
  
  // Security middleware
  if (securityConfig.helmet.enabled) {
    app.use(helmet(securityConfig.helmet.options));
  }
  
  // CORS configuration
  app.enableCors({
    origin: securityConfig.cors.origin,
    credentials: securityConfig.cors.credentials,
  });
  
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  
  // Configurar servir arquivos estáticos (imagens)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });
  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('Ze da Fruta API')
    .setDescription(`
# Ze da Fruta - API de Delivery de Frutas

Esta API fornece endpoints para um sistema de delivery de frutas, organizado por diferentes perfis de usuário.

## Autenticação

### 🔐 Admin (Email/Senha)
- **Email**: zedafruta@admin.com
- **Senha**: zedafruta321
- Use o endpoint \`POST /auth/admin/login\` para obter o token JWT

### 🔐 Cliente/Entregador/Vendedor (Google OAuth)
- Use o endpoint \`GET /auth/google\` para iniciar o login com Google
- Após o callback, use o token JWT retornado

### 🔑 API Key (Alto Volume)
- Para clientes de alto volume, use autenticação por API key
- Adicione o header \`x-api-key: SEU_API_KEY\` nas requisições
- Permite até 1000 requisições por minuto

## Rate Limiting

Esta API implementa rate limiting baseado no tipo de usuário:
- **Público**: 100 requisições por minuto
- **Autenticado**: 300 requisições por minuto  
- **API Key**: 1000 requisições por minuto

## Perfis de Usuário

### 🔐 Admin (Email/Senha)
- **Email**: zedafruta@admin.com
- **Senha**: zedafruta321
- Use o endpoint \`POST /auth/admin/login\` para obter o token JWT

### 🔐 Cliente/Entregador/Vendedor (Google OAuth)
- Use o endpoint \`GET /auth/google\` para iniciar o login com Google
- Após o callback, use o token JWT retornado

## Perfis de Usuário

### 👑 **ADMIN** - Administrador do Sistema
- Gerenciamento completo de usuários, produtos, estabelecimentos
- Acesso a todos os endpoints administrativos
- Upload de imagens para produtos e estabelecimentos

### 👤 **USER** - Cliente Final
- Navegação no catálogo de produtos
- Gerenciamento do próprio perfil
- Upload de foto de perfil

### 🏪 **PARTNER** - Parceiro/Vendedor
- Gerenciamento dos próprios produtos
- Gerenciamento do próprio estabelecimento
- Upload de imagens de produtos e estabelecimento

### 🚚 **DELIVERY** - Entregador
- Gerenciamento do próprio perfil
- Upload de foto de perfil
- Gestão de entregas (futuro)

## Como Usar

1. **Faça login** usando o endpoint apropriado para seu perfil
2. **Copie o token JWT** retornado
3. **Clique em "Authorize"** no topo desta página
4. **Cole o token** no formato: \`Bearer SEU_TOKEN_AQUI\`
5. **Explore os endpoints** organizados por perfil
    `)
    .setVersion('1.0')    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Digite o token JWT no formato: Bearer TOKEN',
        in: 'header',
      },
      'JWT-auth'
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
        description: 'API Key para clientes de alto volume'
      },
      'API-Key'
    )
    .addTag('🔐 Autenticação', 'Endpoints de login e autenticação')
    .addTag('👑 Admin - Usuários', 'Gerenciamento de usuários (Admin)')
    .addTag('👑 Admin - Produtos', 'Gerenciamento de produtos (Admin)')
    .addTag('👑 Admin - Estabelecimentos', 'Gerenciamento de estabelecimentos (Admin)')
    .addTag('👑 Admin - Categorias', 'Gerenciamento de categorias (Admin)')
    .addTag('👤 Cliente - Catálogo', 'Navegação no catálogo (Público/Cliente)')
    .addTag('👤 Cliente - Perfil', 'Gerenciamento de perfil (Cliente)')
    .addTag('👤 Cliente - Endereços', 'Gerenciamento de endereços (Cliente)')
    .addTag('🏪 Parceiro - Produtos', 'Gerenciamento de produtos (Parceiro)')
    .addTag('🏪 Parceiro - Estabelecimento', 'Gerenciamento de estabelecimento (Parceiro)')
    .addTag('🚚 Entregador - Perfil', 'Gerenciamento de perfil (Entregador)')
    .addTag('📸 Upload de Imagens', 'Upload de fotos e imagens')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Ze da Fruta API',
    customfavIcon: '/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0 }
      .swagger-ui .info h1 { color: #4CAF50 }
    `,
  });
  
  await app.listen(process.env.PORT || 3000);
  console.log(`🚀 Application is running on: ${await app.getUrl()}`);
  console.log(`📚 Swagger documentation: ${await app.getUrl()}/api`);
}
bootstrap();
