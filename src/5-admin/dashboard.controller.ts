import { Controller, Get } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  getDashboard() {
    return this.adminService.getDashboard();
  }
}
