import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../common/entities/product.entity'; // Corrigido
import { Category } from '../common/entities/category.entity'; // Adicionado
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    try {
      // Verifica se já existe um produto com o mesmo nome
      const existingProduct = await this.productRepository.findOne({
        where: { name: createProductDto.name }
      });

      if (existingProduct) {
        throw new ConflictException('Já existe um produto com este nome');
      }

      // Verifica se a categoria existe
      const category = await this.categoryRepository.findOneBy({ 
        categoryId: createProductDto.categoryId 
      });

      if (!category) {
        throw new NotFoundException('Categoria não encontrada');
      }

      // Verifica se a data de validade é válida
      if (createProductDto.expirationDate && createProductDto.expirationDate < new Date()) {
        throw new BadRequestException('Data de validade não pode ser no passado');
      }

      const product = this.productRepository.create({
        ...createProductDto,
        category,
        stockQuantity: createProductDto.stockQuantity || 0,
        isActive: createProductDto.isActive ?? true
      });

      return await this.productRepository.save(product);
    } catch (error: unknown) {
      if (error instanceof ConflictException || 
          error instanceof NotFoundException || 
          error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Erro ao criar produto: ' + (error as Error).message);
    }
  }

  async findAll(options?: {
    categoryId?: number;
    isActive?: boolean;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
  }): Promise<Product[]> {
    try {
      const queryBuilder = this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.category', 'category');

      if (options?.categoryId) {
        queryBuilder.andWhere('category.id = :categoryId', { categoryId: options.categoryId });
      }

      if (options?.isActive !== undefined) {
        queryBuilder.andWhere('product.isActive = :isActive', { isActive: options.isActive });
      }

      if (options?.minPrice !== undefined) {
        queryBuilder.andWhere('product.price >= :minPrice', { minPrice: options.minPrice });
      }

      if (options?.maxPrice !== undefined) {
        queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice: options.maxPrice });
      }

      if (options?.search) {
        queryBuilder.andWhere(
          '(product.name LIKE :search OR product.description LIKE :search)',
          { search: `%${options.search}%` }
        );
      }

      return await queryBuilder.getMany();
    } catch (error: unknown) {
      throw new BadRequestException('Erro ao buscar produtos: ' + (error as Error).message);
    }
  }

  async findOneByName(name: string): Promise<Product> {
    try {
      const product = await this.productRepository.findOne({
        where: { name },
        relations: ['category']
      });

      if (!product) {
        throw new NotFoundException(`Produto com nome "${name}" não encontrado`);
      }

      return product;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Erro ao buscar produto: ' + (error as Error).message);
    }
  }

  async updateByName(name: string, updateProductDto: UpdateProductDto): Promise<Product> {
    try {
      const product = await this.findOneByName(name);

      if (updateProductDto.categoryId) {
        const category = await this.categoryRepository.findOneBy({ 
          categoryId: updateProductDto.categoryId 
        });
        if (!category) {
          throw new NotFoundException('Categoria não encontrada');
        }
        product.category = category;
      }

      if (updateProductDto.expirationDate && updateProductDto.expirationDate < new Date()) {
        throw new BadRequestException('Data de validade não pode ser no passado');
      }

      Object.assign(product, updateProductDto);
      return await this.productRepository.save(product);
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Erro ao atualizar produto: ' + (error as Error).message);
    }
  }

  async removeByName(name: string): Promise<boolean> {
    try {
      const product = await this.findOneByName(name);
      const result = await this.productRepository.remove(product);
      return !!result;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Erro ao remover produto: ' + (error as Error).message);
    }
  }

  async updateStock(name: string, quantity: number): Promise<Product> {
    try {
      const product = await this.findOneByName(name);
      
      if (product.stockQuantity + quantity < 0) {
        throw new BadRequestException('Quantidade em estoque não pode ficar negativa');
      }

      product.stockQuantity += quantity;
      return await this.productRepository.save(product);
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Erro ao atualizar estoque: ' + (error as Error).message);
    }
  }

  async updateRating(name: string, rating: number): Promise<Product> {
    try {
      if (rating < 1 || rating > 5) {
        throw new BadRequestException('Avaliação deve estar entre 1 e 5');
      }

      const product = await this.findOneByName(name);
      
      const newRatingCount = product.ratingCount + 1;
      const newRating = ((product.rating * product.ratingCount) + rating) / newRatingCount;

      product.rating = newRating;
      product.ratingCount = newRatingCount;

      return await this.productRepository.save(product);
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Erro ao atualizar avaliação: ' + (error as Error).message);
    }
  }
}