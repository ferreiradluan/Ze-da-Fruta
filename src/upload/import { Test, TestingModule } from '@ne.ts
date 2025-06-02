import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadModule } from './upload.module';
import { Product } from '../common/entities/product.entity';
import { AuthModule } from '../auth/auth.module';
import { JwtService } from '@nestjs/jwt';
import * as fs from 'fs';
import * as path from 'path';

describe('UploadModule (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Product],
          synchronize: true,
        }),
        AuthModule,
        UploadModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get<JwtService>(JwtService);
    
    // Create a valid JWT token for testing
    authToken = jwtService.sign({ userId: 1, username: 'testuser' });
    
    await app.init();

    // Ensure uploads directory exists
    const uploadsDir = './uploads';
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  });

  afterAll(async () => {
    // Clean up uploaded test files
    const uploadsDir = './uploads';
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      files.forEach(file => {
        if (file.startsWith('test-')) {
          fs.unlinkSync(path.join(uploadsDir, file));
        }
      });
    }
    await app.close();
  });

  describe('POST /upload', () => {
    it('should upload a valid image file successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('fake-image-data'), 'test-image.jpg')
        .expect(201);

      expect(response.body).toHaveProperty('filename');
      expect(response.body.filename).toMatch(/\.jpg$/);
    });

    it('should reject upload without authentication', async () => {
      await request(app.getHttpServer())
        .post('/upload')
        .attach('file', Buffer.from('fake-image-data'), 'test-image.jpg')
        .expect(401);
    });

    it('should reject upload with invalid token', async () => {
      await request(app.getHttpServer())
        .post('/upload')
        .set('Authorization', 'Bearer invalid-token')
        .attach('file', Buffer.from('fake-image-data'), 'test-image.jpg')
        .expect(401);
    });

    it('should reject non-image files', async () => {
      await request(app.getHttpServer())
        .post('/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('fake-text-data'), 'test-document.txt')
        .expect(400);
    });

    it('should accept PNG files', async () => {
      const response = await request(app.getHttpServer())
        .post('/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('fake-png-data'), 'test-image.png')
        .expect(201);

      expect(response.body.filename).toMatch(/\.png$/);
    });

    it('should accept GIF files', async () => {
      const response = await request(app.getHttpServer())
        .post('/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('fake-gif-data'), 'test-image.gif')
        .expect(201);

      expect(response.body.filename).toMatch(/\.gif$/);
    });

    it('should reject files larger than 5MB', async () => {
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
      
      await request(app.getHttpServer())
        .post('/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', largeBuffer, 'large-image.jpg')
        .expect(413);
    });

    it('should accept files smaller than 5MB', async () => {
      const smallBuffer = Buffer.alloc(1024 * 1024); // 1MB
      
      const response = await request(app.getHttpServer())
        .post('/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', smallBuffer, 'small-image.jpg')
        .expect(201);

      expect(response.body).toHaveProperty('filename');
    });

    it('should generate unique filenames for uploaded files', async () => {
      const file1Response = await request(app.getHttpServer())
        .post('/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('fake-data-1'), 'same-name.jpg')
        .expect(201);

      const file2Response = await request(app.getHttpServer())
        .post('/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('fake-data-2'), 'same-name.jpg')
        .expect(201);

      expect(file1Response.body.filename).not.toBe(file2Response.body.filename);
    });

    it('should preserve file extension', async () => {
      const response = await request(app.getHttpServer())
        .post('/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('fake-jpeg-data'), 'test-image.jpeg')
        .expect(201);

      expect(response.body.filename).toMatch(/\.jpeg$/);
    });

    it('should reject request without file', async () => {
      await request(app.getHttpServer())
        .post('/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('File Storage', () => {
    it('should save uploaded files to uploads directory', async () => {
      const response = await request(app.getHttpServer())
        .post('/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('test-file-content'), 'storage-test.jpg')
        .expect(201);

      const uploadedFilePath = path.join('./uploads', response.body.filename);
      expect(fs.existsSync(uploadedFilePath)).toBe(true);

      // Clean up
      fs.unlinkSync(uploadedFilePath);
    });

    it('should generate 32-character random filename', async () => {
      const response = await request(app.getHttpServer())
        .post('/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('filename-test-content'), 'filename-test.jpg')
        .expect(201);

      const filename = response.body.filename;
      const nameWithoutExt = path.parse(filename).name;
      expect(nameWithoutExt).toHaveLength(32);
      expect(nameWithoutExt).toMatch(/^[0-9a-f]+$/);

      // Clean up
      const uploadedFilePath = path.join('./uploads', filename);
      if (fs.existsSync(uploadedFilePath)) {
        fs.unlinkSync(uploadedFilePath);
      }
    });
  });
});