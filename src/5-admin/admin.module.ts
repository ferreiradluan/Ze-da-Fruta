import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { CuponsModule } from '../cupons/cupons.module';
import { UsersModule } from '../users/users.module';
import { PedidosModule } from '../pedidos/pedidos.module';
import { PagamentosModule } from '../pagamentos/pagamentos.module';
import { EstabelecimentosModule } from '../estabelecimentos/estabelecimentos.module';
import { PerfilUsuarioModule } from '../perfil-usuario/perfil-usuario.module';

@Module({
  imports: [
    CuponsModule,
    UsersModule,
    PedidosModule, // já está aqui, mas vamos garantir exportação
    PagamentosModule,
    EstabelecimentosModule,
    PerfilUsuarioModule
  ],
  controllers: [AdminController],
})
export class AdminModule {}
