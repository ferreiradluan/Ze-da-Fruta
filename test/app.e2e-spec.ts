import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET) health check', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200); // health endpoint agora existe
  });

  it('/products (GET) deve retornar lista de produtos (público)', async () => {
    const res = await request(app.getHttpServer())
      .get('/products')
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('/categories (GET) deve retornar lista de categorias (público)', async () => {
    const res = await request(app.getHttpServer())
      .get('/categories')
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // Não é possível automatizar login Google, nem testar rotas protegidas sem token válido
  // Testes de rotas protegidas podem ser feitos manualmente ou mockando guards em testes unitários
});
