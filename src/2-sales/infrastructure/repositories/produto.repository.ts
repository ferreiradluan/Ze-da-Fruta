import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Produto } from '../../domain/entities/produto.entity';

@Injectable()
export class ProdutoRepository {
  constructor(
    @InjectRepository(Produto)
    private readonly repository: Repository<Produto>,
  ) {}

  async findById(id: string): Promise<Produto | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['categorias', 'estabelecimento'],
    });
  }

  async findByIds(ids: string[]): Promise<Produto[]> {
    return await this.repository.find({
      where: { id: ids as any },
      relations: ['categorias', 'estabelecimento'],
    });
  }

  async findByEstabelecimento(estabelecimentoId: string): Promise<Produto[]> {
    return await this.repository.find({
      where: { 
        estabelecimentoId,
        ativo: true,
        disponivel: true,
      },
      relations: ['categorias'],
      order: { nome: 'ASC' },
    });
  }

  async findByCategoria(categoriaId: string): Promise<Produto[]> {
    return await this.repository
      .createQueryBuilder('produto')
      .leftJoinAndSelect('produto.categorias', 'categoria')
      .where('categoria.id = :categoriaId', { categoriaId })
      .andWhere('produto.ativo = true')
      .andWhere('produto.disponivel = true')
      .orderBy('produto.nome', 'ASC')
      .getMany();
  }

  async findDisponiveis(): Promise<Produto[]> {
    return await this.repository.find({
      where: {
        ativo: true,
        disponivel: true,
      },
      relations: ['categorias', 'estabelecimento'],
      order: { nome: 'ASC' },
    });
  }

  async save(produto: Produto): Promise<Produto> {
    return await this.repository.save(produto);
  }

  async update(id: string, dados: Partial<Produto>): Promise<void> {
    await this.repository.update(id, dados);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async count(): Promise<number> {
    return await this.repository.count();
  }

  async findComEstoqueBaixo(limite: number = 10): Promise<Produto[]> {
    return await this.repository.find({
      where: {
        ativo: true,
        disponivel: true,
      },
      relations: ['estabelecimento'],
      order: { estoque: 'ASC' },
    }).then(produtos => produtos.filter(p => p.estoque <= limite));
  }
}
