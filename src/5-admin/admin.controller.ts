import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../1-account-management/guards/jwt-auth.guard';
import { RolesGuard } from '../1-account-management/guards/roles.guard';
import { Roles } from '../1-account-management/decorators/roles.decorator';
import { ROLE } from '../1-account-management/domain/types/role.types';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.ADMIN)
export class AdminController {
  @Get('dashboard')
  async getDashboard() {
    return { message: 'Admin Dashboard' };
  }
}
