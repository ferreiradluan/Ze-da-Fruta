import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product } from '../common/entities/product.entity';
import { Category } from '../common/entities/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Category])], // Importa as entidades
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [TypeOrmModule], // Exporta o TypeOrmModule para outros módulos, se necessário
})
export class ProductsModule {}