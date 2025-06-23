import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { IMAGE_TYPE, ImageType } from '../types/image.types';

export interface ImageUploadResult {
  originalName: string;
  filename: string;
  path: string;
  size: number;
  url: string;
}

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);
  private readonly uploadPath = path.join(process.cwd(), 'uploads');
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  private readonly allowedMimeTypes = ['image/png'];

  constructor(private readonly configService: ConfigService) {
    this.ensureUploadDirectory();
  }

  private ensureUploadDirectory(): void {
    try {
      if (!fs.existsSync(this.uploadPath)) {
        fs.mkdirSync(this.uploadPath, { recursive: true });
        this.logger.log(`Created upload directory: ${this.uploadPath}`);
      }      // Criar subdiretórios para cada tipo de imagem
      Object.values(IMAGE_TYPE).forEach(type => {
        const typeDir = path.join(this.uploadPath, type);
        if (!fs.existsSync(typeDir)) {
          fs.mkdirSync(typeDir, { recursive: true });
          this.logger.log(`Created directory: ${typeDir}`);
        }
      });
    } catch (error) {
      this.logger.error('Failed to create upload directories', error);
      throw new InternalServerErrorException('Erro ao configurar diretórios de upload');
    }
  }

  async processAndSaveImage(
    file: Express.Multer.File,
    imageType: ImageType,
    userId?: string
  ): Promise<ImageUploadResult> {
    try {
      // Validar arquivo
      this.validateFile(file);

      // Gerar nome único para o arquivo
      const filename = this.generateFilename(file.originalname, userId);
      const typePath = path.join(this.uploadPath, imageType);
      const fullPath = path.join(typePath, filename);

      // Processar imagem com Sharp
      await this.processImage(file.buffer, fullPath, imageType);

      // Obter informações do arquivo salvo
      const stats = fs.statSync(fullPath);
      const baseUrl = this.configService.get<string>('BASE_URL') || 'http://localhost:3000';
      
      const result: ImageUploadResult = {
        originalName: file.originalname,
        filename,
        path: fullPath,
        size: stats.size,
        url: `${baseUrl}/uploads/${imageType}/${filename}`
      };

      this.logger.log(`Image processed successfully: ${filename}`);
      return result;

    } catch (error) {
      this.logger.error('Error processing image', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao processar imagem');
    }
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Apenas arquivos PNG são permitidos');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException('Arquivo muito grande. Tamanho máximo: 5MB');
    }

    // Validar se é realmente um PNG verificando os magic bytes
    if (!this.isPngFile(file.buffer)) {
      throw new BadRequestException('Arquivo inválido. Apenas imagens PNG são aceitas');
    }
  }

  private isPngFile(buffer: Buffer): boolean {
    // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
    const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
    
    if (buffer.length < 8) return false;
    
    for (let i = 0; i < pngSignature.length; i++) {
      if (buffer[i] !== pngSignature[i]) {
        return false;
      }
    }
    return true;
  }

  private generateFilename(originalName: string, userId?: string): string {
    const timestamp = Date.now();
    const uuid = uuidv4();
    const userPrefix = userId ? `${userId}_` : '';
    return `${userPrefix}${timestamp}_${uuid}.png`;
  }

  private async processImage(
    buffer: Buffer,
    outputPath: string,
    imageType: ImageType
  ): Promise<void> {
    try {
      let processor = sharp(buffer)
        .png({ quality: 90, compressionLevel: 6 })
        .withMetadata();      // Aplicar redimensionamento baseado no tipo
      switch (imageType) {
        case IMAGE_TYPE.PROFILE:
          processor = processor.resize(300, 300, {
            fit: 'cover',
            position: 'center'
          });
          break;
        case IMAGE_TYPE.PRODUCT:
          processor = processor.resize(800, 600, {
            fit: 'inside',
            withoutEnlargement: true
          });
          break;
        case IMAGE_TYPE.ESTABLISHMENT:
          processor = processor.resize(1200, 400, {
            fit: 'cover',
            position: 'center'
          });
          break;
      }

      await processor.toFile(outputPath);
    } catch (error) {
      this.logger.error('Error processing image with Sharp', error);
      throw new InternalServerErrorException('Erro ao processar imagem');
    }
  }

  async deleteImage(imagePath: string): Promise<void> {
    try {
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        this.logger.log(`Deleted image: ${imagePath}`);
      }
    } catch (error) {
      this.logger.error('Error deleting image', error);
      // Não falhar a operação se não conseguir deletar a imagem
    }
  }

  getImageUrl(filename: string, imageType: ImageType): string {
    const baseUrl = this.configService.get<string>('BASE_URL') || 'http://localhost:3000';
    return `${baseUrl}/uploads/${imageType}/${filename}`;
  }

  validateImageExists(filename: string, imageType: ImageType): boolean {
    const imagePath = path.join(this.uploadPath, imageType, filename);
    return fs.existsSync(imagePath);
  }
}
