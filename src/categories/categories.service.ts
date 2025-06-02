import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../common/entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const category = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(category);
  }

  findAll(): Promise<Category[]> {
    return this.categoryRepository.find();
  }

  findOne(id: number): Promise<Category | null> {
    return this.categoryRepository.findOneBy({ categoryId: id });
  }

  findOneByName(name: string): Promise<Category | null> {
    return this.categoryRepository.findOneBy({ name });
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto): Promise<Category | null> {
    const category = await this.findOne(id);
    if (!category) return null; // Ajustado para aceitar null
    Object.assign(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }

  async updateByName(name: string, updateCategoryDto: UpdateCategoryDto): Promise<Category | null> {
    const category = await this.findOneByName(name);
    if (!category) return null; // Retorno ajustado para aceitar null
    Object.assign(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.categoryRepository.delete(id);
    return result.affected ? result.affected > 0 : false; // Verificação ajustada
  }

  async removeByName(name: string): Promise<boolean> {
    const result = await this.categoryRepository.delete({ name });
    return result.affected ? result.affected > 0 : false; // Verificação ajustada
  }
}