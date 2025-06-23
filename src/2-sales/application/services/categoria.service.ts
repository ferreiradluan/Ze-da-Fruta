import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Categoria } from '../../domain/entities/categoria.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * 🔧 FASE 4: CATEGORIASERVICE OTIMIZADO PARA REST
 * 
 * ✅ APENAS persistência e consultas
 * ✅ Lógica de negócio está na entidade Categoria
 */
@Injectable()
export class CategoriaService {
  constructor(
    @InjectRepository(Categoria)
    private categoriaRepository: Repository<Categoria>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * ✅ Lista categorias públicas para catálogo
   */
  async listarCategoriasPublico(): Promise<Categoria[]> {
    return this.categoriaRepository.find({
      where: { ativo: true },
      order: { nome: 'ASC' },
    });
  }

  /**
   * ✅ Obter categoria por ID
   */
  async obterCategoriaPorId(id: string): Promise<Categoria> {
    const categoria = await this.categoriaRepository.findOne({
      where: { id },
    });

    if (!categoria) {
      throw new NotFoundException(`Categoria com ID ${id} não encontrada`);
    }

    return categoria;
  }

  /**
   * ✅ Lista todas as categorias para administração
   */
  async listarCategorias(): Promise<Categoria[]> {
    return this.categoriaRepository.find({
      order: { nome: 'ASC' },
    });
  }
  /**
   * ✅ Criar nova categoria
   */
  async criarCategoria(dados: any): Promise<Categoria> {
    const novaCategoria = this.categoriaRepository.create({
      nome: dados.nome,
      descricao: dados.descricao,
      ativo: true
    });
    
    return this.categoriaRepository.save(novaCategoria);
  }

  /**
   * ✅ Atualizar categoria
   */
  async atualizarCategoria(usuario: any, id: string, updateData: any): Promise<Categoria> {
    const categoria = await this.obterCategoriaPorId(id);
    
    Object.assign(categoria, updateData);
    
    return this.categoriaRepository.save(categoria);
  }

  /**
   * ✅ Desativar categoria (soft delete)
   */
  async excluirCategoria(usuario: any, id: string): Promise<void> {
    const categoria = await this.obterCategoriaPorId(id);
    categoria.ativo = false;
    await this.categoriaRepository.save(categoria);
  }
}
