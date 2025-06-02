import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PedidosController } from './pedidos.controller';
import { PedidosService } from './pedidos.service';
import { Pedido } from '../common/entities/pedido.entity';
import { UsersModule } from '../users/users.module';
import { EnderecosModule } from '../enderecos/enderecos.module';

@Module({
  imports: [TypeOrmModule.forFeature([Pedido]), UsersModule, EnderecosModule],
  controllers: [PedidosController],
  providers: [PedidosService],
  exports: [PedidosService], // exporta o service para outros módulos
})
export class PedidosModule {}