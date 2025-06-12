import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Estabelecimento } from '../../domain/entities/estabelecimento.entity';

@Injectable()
export class EstabelecimentoRepository {
  constructor(
    @InjectRepository(Estabelecimento)
    private readonly repository: Repository<Estabelecimento>,
  ) {}

  async findById(id: string): Promise<Estabelecimento | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['produtos'],
    });
  }

  async findAll(): Promise<Estabelecimento[]> {
    return await this.repository.find({
      where: { ativo: true },
      relations: ['produtos'],
      order: { nome: 'ASC' },
    });
  }

  async findAbertos(): Promise<Estabelecimento[]> {
    return await this.repository.find({
      where: { 
        ativo: true,
        estaAberto: true,
      },
      relations: ['produtos'],
      order: { nome: 'ASC' },
    });
  }

  async findByCnpj(cnpj: string): Promise<Estabelecimento | null> {
    return await this.repository.findOne({
      where: { cnpj },
    });
  }

  async findByNome(nome: string): Promise<Estabelecimento[]> {
    return await this.repository
      .createQueryBuilder('estabelecimento')
      .where('estabelecimento.nome ILIKE :nome', { nome: `%${nome}%` })
      .andWhere('estabelecimento.ativo = true')
      .orderBy('estabelecimento.nome', 'ASC')
      .getMany();
  }

  async save(estabelecimento: Estabelecimento): Promise<Estabelecimento> {
    return await this.repository.save(estabelecimento);
  }

  async update(id: string, dados: Partial<Estabelecimento>): Promise<void> {
    await this.repository.update(id, dados);
  }

  async delete(id: string): Promise<void> {
    await this.repository.update(id, { ativo: false });
  }

  async count(): Promise<number> {
    return await this.repository.count({ where: { ativo: true } });
  }

  async countAbertos(): Promise<number> {
    return await this.repository.count({ 
      where: { 
        ativo: true,
        estaAberto: true,
      } 
    });
  }

  async findByUsuario(usuarioId: string): Promise<Estabelecimento | null> {
    return await this.repository.findOne({
      where: { usuarioId }
    });
  }

  async findPublic(): Promise<Estabelecimento[]> {
    return await this.repository.find({
      where: { ativo: true },
      order: { nome: 'ASC' }
    });
  }
}
