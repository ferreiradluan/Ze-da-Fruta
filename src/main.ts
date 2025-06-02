import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { UsersService } from './users/users.service';
import { UserRole, UserProfileType } from './users/entities/user.entity';

async function seedAdminUser(app: INestApplication) {
  const usersService = app.get(UsersService);
  const adminEmail = 'admin@zedafruta.com';
  const existing = await usersService.findByEmail(adminEmail);
  if (!existing) {
    await usersService.create({
      email: adminEmail,
      firstName: 'Admin',
      lastName: 'ZedaFruta',
      senha: '$2b$10$mAsvA0Il6yAmiYW1xugjA.BS4AcWe0QxzHD3fwNqACqoYl277NNCe',
      provider: 'local',
      role: UserRole.ADMIN,
      profileType: UserProfileType.CUSTOMER,
      isEmailVerified: true,
    });
    console.log('Usuário admin criado automaticamente.');
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  // Enable security headers
  app.use(helmet());
  
  // Enable CORS
  app.enableCors({
    origin: configService.get('FRONTEND_URL') || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Enable validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('API documentation for the e-commerce platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = configService.get('PORT') || 3000;
  await seedAdminUser(app);
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();