import { Module } from '@nestjs/common';
import { AdminUsuariosController } from './usuarios.controller';
import { AdminSolicitacoesLojasController } from './solicitacoes-lojas.controller';
import { AdminPedidosController } from './pedidos.controller';
import { AdminDashboardController } from './dashboard.controller';
import { AdminService } from './admin.service';

@Module({
  controllers: [
    AdminUsuariosController,
    AdminSolicitacoesLojasController,
    AdminPedidosController,
    AdminDashboardController
  ],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminDomainModule {}
