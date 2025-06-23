import {
  Controller,
  Post,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Req,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { multerConfig } from '../config/multer.config';
import { ImageService } from '../services/image.service';
import { IMAGE_TYPE, ImageType } from '../types/image.types';
import { JwtAuthGuard } from '../../1-account-management/application/strategies/guards/jwt-auth.guard';
import { RolesGuard } from '../../1-account-management/application/strategies/guards/roles.guard';
import { Roles } from '../../1-account-management/application/strategies/guards/roles.decorator';
import { ROLE_TYPE } from '../../1-account-management/domain/types/role-type.types';
import { AccountService } from '../../1-account-management/application/services/account.service';
import { DeliveryService } from '../../3-delivery/application/services/delivery.service';

@ApiTags('📤 Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class UploadController {
  constructor(
    private readonly imageService: ImageService,
    private readonly accountService: AccountService,
    private readonly deliveryService: DeliveryService,
  ) {}
  @Post('profile-photo')
  @UseInterceptors(FileInterceptor('image', multerConfig))
  @ApiOperation({ 
    summary: 'Upload profile photo - DESABILITADO para OAuth Google',
    description: 'Este endpoint está desabilitado pois o sistema usa Google OAuth. A foto do perfil vem automaticamente do Google.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Upload de foto desabilitado - Sistema usa foto do Google OAuth',
  })
  async uploadProfilePhoto(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    // ❌ REMOVIDO: Upload de foto não faz sentido com OAuth Google
    // A foto do usuário vem diretamente do perfil Google
    throw new BadRequestException(
      'Upload de foto desabilitado: Sistema usa Google OAuth. ' +
      'A foto do perfil vem automaticamente do Google e é atualizada automaticamente.'
    );
  }
  @Delete('profile-photo')
  @ApiOperation({ 
    summary: 'Delete profile photo - DESABILITADO para OAuth Google',
    description: 'Este endpoint está desabilitado pois o sistema usa Google OAuth. A foto do perfil é gerenciada pelo Google.'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Deleção de foto desabilitada - Sistema usa foto do Google OAuth',
  })
  async deleteProfilePhoto(@Req() req: any) {
    // ❌ REMOVIDO: Deleção de foto não faz sentido com OAuth Google
    // A foto do usuário é gerenciada pelo Google
    throw new BadRequestException(
      'Deleção de foto desabilitada: Sistema usa Google OAuth. ' +
      'A foto do perfil é gerenciada pelo Google e não pode ser removida pelo sistema.'
    );
  }

// COMMENTED OUT - Product and establishment photo upload methods temporarily disabled
  // These methods use removed SalesService methods that violate the PlantUML diagram constraints
    /*
  @Post('product-photo/:productId')
  @Roles(ROLE_TYPE.ADMIN, ROLE_TYPE.PARTNER)
  async uploadProductPhoto() {
    throw new BadRequestException('Product photo upload temporarily disabled');
  }

  @Post('establishment-photo/:establishmentId')
  @Roles(ROLE_TYPE.ADMIN, ROLE_TYPE.PARTNER)
  async uploadEstablishmentPhoto() {
    throw new BadRequestException('Establishment photo upload temporarily disabled');
  }
  */
}

