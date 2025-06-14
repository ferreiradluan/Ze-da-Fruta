import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cupom } from '../../domain/entities/cupom.entity';

@Injectable()
export class CupomRepository {
  constructor(
    @InjectRepository(Cupom)
    private readonly cupomRepository: Repository<Cupom>,
  ) {}

  async findById(id: string): Promise<Cupom | null> {
    return await this.cupomRepository.findOne({
      where: { id },
    });
  }

  async findByCodigo(codigo: string): Promise<Cupom | null> {
    return await this.cupomRepository.findOne({
      where: { codigo },
    });
  }

  async findAtivos(): Promise<Cupom[]> {
    const agora = new Date();
    return await this.cupomRepository
      .createQueryBuilder('cupom')
      .where('cupom.ativo = :ativo', { ativo: true })
      .andWhere('cupom.dataValidade >= :agora', { agora })
      .getMany();
  }

  async save(cupom: Cupom): Promise<Cupom> {
    return await this.cupomRepository.save(cupom);
  }

  async delete(id: string): Promise<void> {
    await this.cupomRepository.delete(id);
  }

  async findByEstabelecimento(estabelecimentoId: string): Promise<Cupom[]> {
    return await this.cupomRepository.find({
      where: { estabelecimentoId },
      order: { createdAt: 'DESC' }
    });
  }
}
