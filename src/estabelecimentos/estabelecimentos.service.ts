import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Estabelecimento } from '../common/entities/estabelecimento.entity';

@Injectable()
export class EstabelecimentosService {
  constructor(
    @InjectRepository(Estabelecimento)
    private readonly estabelecimentoRepository: Repository<Estabelecimento>,
  ) {}

  async findAll(filtro?: any): Promise<Estabelecimento[]> {
    const where: any = {};
    if (filtro?.nome) where.nome = filtro.nome;
    if (filtro?.cidade) where.endereco = filtro.cidade; // Ajuste se cidade for campo separado
    if (filtro?.status) where.status = filtro.status;
    return this.estabelecimentoRepository.find({ where });
  }

  findOne(id: number): Promise<Estabelecimento | null> {
    return this.estabelecimentoRepository.findOneBy({ estabelecimentoId: id });
  }

  create(estabelecimento: Partial<Estabelecimento>): Promise<Estabelecimento> {
    const newEstabelecimento = this.estabelecimentoRepository.create(estabelecimento);
    return this.estabelecimentoRepository.save(newEstabelecimento);
  }

  async update(id: number, estabelecimento: Partial<Estabelecimento>): Promise<Estabelecimento | null> {
    const existingEstabelecimento = await this.findOne(id);
    if (!existingEstabelecimento) return null;
    Object.assign(existingEstabelecimento, estabelecimento);
    return this.estabelecimentoRepository.save(existingEstabelecimento);
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.estabelecimentoRepository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }

  async findPendentes(): Promise<Estabelecimento[]> {
    return this.estabelecimentoRepository.find({ where: { status: 'PENDENTE' } });
  }
}