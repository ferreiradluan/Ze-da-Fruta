import { Controller, Post, UseInterceptors, UploadedFile, Param, ParseIntPipe, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { UploadService } from './upload.service';

@Controller('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}
  
  @Post('product/:id/image')
  @Roles(Role.ADMIN, Role.SELLER)
  @UseInterceptors(FileInterceptor('file'))
  async uploadProductImage(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      if (!file) {
        throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
      }

      if (!id || id <= 0) {
        throw new HttpException('Invalid product ID', HttpStatus.BAD_REQUEST);
      }

      // Log the upload details
      console.log('Uploaded file:', {
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size
      });
      console.log('Product ID:', id);

      // Construir a URL da imagem
      const imageUrl = `/uploads/${file.filename}`;

      // Atualizar o produto com a URL da imagem
      const updatedProduct = await this.uploadService.updateProductImage(id, imageUrl);

      return {
        statusCode: HttpStatus.OK,
        message: 'File uploaded successfully',
        data: {
          filename: file.filename,
          productId: id,
          mimetype: file.mimetype,
          size: file.size,
          imageUrl: updatedProduct.imageUrl
        }
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Error && error.message === 'Product not found') {
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
      }
      console.error('Upload error:', error);
      throw new HttpException(
        'Error uploading file',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}