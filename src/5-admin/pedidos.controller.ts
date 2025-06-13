import { Controller, Post, Param } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin/pedidos')
export class AdminPedidosController {
  constructor(private readonly adminService: AdminService) {}

  @Post(':id/reembolso')
  reembolsarPedido(@Param('id') id: number) {
    return this.adminService.reembolsarPedido(id);
  }
}
