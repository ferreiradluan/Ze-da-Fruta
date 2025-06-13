import { Controller, Get, Put, Param, Body } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin/usuarios')
export class AdminUsuariosController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  getUsuarios() {
    return this.adminService.getUsuarios();
  }

  @Put(':id/status')
  atualizarStatus(@Param('id') id: number, @Body() statusDto: any) {
    return this.adminService.atualizarStatusUsuario(id, statusDto);
  }
}
