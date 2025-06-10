import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';

export const multerConfig: MulterOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1, // Apenas um arquivo por vez
  },
  fileFilter: (req, file, callback) => {
    // Validação inicial do tipo MIME
    if (file.mimetype !== 'image/png') {
      return callback(
        new BadRequestException('Apenas arquivos PNG são permitidos'),
        false
      );
    }
    callback(null, true);
  },
};

// Interceptor para validação adicional
export const createMulterOptions = (): MulterOptions => multerConfig;
