import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItensPedidoController } from './itens-pedido.controller';
import { ItensPedidoService } from './itens-pedido.service';
import { ItemPedido } from '../common/entities/item-pedido.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ItemPedido])],
  controllers: [ItensPedidoController],
  providers: [ItensPedidoService],
})
export class ItensPedidoModule {}