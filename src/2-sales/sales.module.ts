import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesLojasController } from './lojas.controller';
import { SalesProdutosController } from './produtos.controller';
import { SalesCategoriasController } from './categorias.controller';
import { SalesPedidosController } from './pedidos.controller';
import { SalesSacolaController } from './sacola.controller';
import { SalesService } from './sales.service';
import { Pedido } from '../pedidos/pedidos.service';
import { Product } from '../products/products.service';
import { Categoria } from '../categories/categories.service';

@Module({
  imports: [TypeOrmModule.forFeature([Pedido, Product, Categoria])],
  controllers: [SalesLojasController, SalesProdutosController, SalesCategoriasController, SalesPedidosController, SalesSacolaController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
