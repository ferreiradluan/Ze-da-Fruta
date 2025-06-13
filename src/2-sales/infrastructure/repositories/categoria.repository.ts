import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Categoria } from '../../domain/entities/categoria.entity';

@Injectable()
export class CategoriaRepository {
  constructor(
    @InjectRepository(Categoria)
    private readonly categoriaRepository: Repository<Categoria>,
  ) {}

  async findAll(): Promise<Categoria[]> {
    return await this.categoriaRepository.find({
      order: { nome: 'ASC' }
    });
  }

  async findById(id: string): Promise<Categoria | null> {
    return await this.categoriaRepository.findOne({ where: { id } });
  }

  async save(categoria: Categoria): Promise<Categoria> {
    return await this.categoriaRepository.save(categoria);
  }

  async delete(id: string): Promise<void> {
    await this.categoriaRepository.delete(id);
  }

  async findByEstabelecimento(estabelecimentoId: string): Promise<Categoria[]> {
    return await this.categoriaRepository.find({
      where: { estabelecimentoId },
      order: { nome: 'ASC' }
    });
  }
}
