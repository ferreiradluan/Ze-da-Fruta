import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../common/entities/product.entity';

@Injectable()
export class UploadService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async updateProductImage(productId: number, imageUrl: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { productId: productId } });
    if (!product) {
      throw new Error('Product not found');
    }
    
    product.imageUrl = imageUrl;
    return this.productRepository.save(product);
  }
} 