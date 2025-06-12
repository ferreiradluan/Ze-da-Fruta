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
import { ImageService, ImageType } from '../services/image.service';
import { JwtAuthGuard } from '../../1-account-management/application/strategies/guards/jwt-auth.guard';
import { RolesGuard } from '../../1-account-management/application/strategies/guards/roles.guard';
import { Roles } from '../../1-account-management/application/strategies/guards/roles.decorator';
import { RoleType } from '../../1-account-management/domain/enums/role-type.enum';
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
  @ApiOperation({ summary: 'Upload profile photo for authenticated user' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile photo uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Profile photo uploaded successfully' },
        imageUrl: { type: 'string', example: '/uploads/profile/user-123-profile.png' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file format or file too large',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User not authenticated',
  })
  async uploadProfilePhoto(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const userId = req.user.sub || req.user.id;
    const userRole = req.user.role;

    // Process and save the image
    const imageResult = await this.imageService.processAndSaveImage(file, ImageType.PROFILE, userId);    // Update user profile based on role
    switch (userRole) {
      case RoleType.ADMIN:
        await this.accountService.updateAdminProfilePhoto(userId, imageResult.url);
        break;
      case RoleType.USER:
      case RoleType.PARTNER:
        await this.accountService.updateUserProfilePhoto(userId, imageResult.url);
        break;
      case RoleType.DELIVERY:
        await this.deliveryService.updateDeliveryDriverProfilePhoto(req.user, userId, imageResult.url);
        break;
      default:
        throw new BadRequestException('Invalid user role');
    }

    return {
      message: 'Profile photo uploaded successfully',
      imageUrl: imageResult.url,
    };
  }

  @Delete('profile-photo')
  @ApiOperation({ summary: 'Delete profile photo for authenticated user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile photo deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Profile photo deleted successfully' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User not authenticated',
  })
  async deleteProfilePhoto(@Req() req: any) {
    const userId = req.user.sub || req.user.id;
    const userRole = req.user.role;    // Get current image URL to delete the file and remove from profile
    switch (userRole) {
      case RoleType.ADMIN:
        const currentPhotoUrl = await this.accountService.deleteAdminProfilePhoto(userId);
        if (currentPhotoUrl) {
          await this.imageService.deleteImage(currentPhotoUrl);
        }
        break;
      case RoleType.USER:
      case RoleType.PARTNER:
        const currentUserPhotoUrl = await this.accountService.deleteUserProfilePhoto(userId);
        if (currentUserPhotoUrl) {
          await this.imageService.deleteImage(currentUserPhotoUrl);
        }
        break;
      case RoleType.DELIVERY:
        await this.deliveryService.deleteDeliveryDriverProfilePhoto(req.user, userId);
        break;
      default:
        throw new BadRequestException('Invalid user role');
    }
  }

// COMMENTED OUT - Product and establishment photo upload methods temporarily disabled
  // These methods use removed SalesService methods that violate the PlantUML diagram constraints
  
  /*
  @Post('product-photo/:productId')
  @Roles(RoleType.ADMIN, RoleType.PARTNER)
  async uploadProductPhoto() {
    throw new BadRequestException('Product photo upload temporarily disabled');
  }

  @Post('establishment-photo/:establishmentId')
  @Roles(RoleType.ADMIN, RoleType.PARTNER)
  async uploadEstablishmentPhoto() {
    throw new BadRequestException('Establishment photo upload temporarily disabled');
  }
  */
}

