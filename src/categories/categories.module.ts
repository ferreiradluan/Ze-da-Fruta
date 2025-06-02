import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { Category } from '../common/entities/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Category])], // Importa a entidade
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [TypeOrmModule], // Exporta o TypeOrmModule para outros módulos, se necessário
})
export class CategoriesModule {}