import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cupom } from '../../domain/entities/cupom.entity';

@Injectable()
export class CupomRepository {
  constructor(
    @InjectRepository(Cupom)
    private readonly repository: Repository<Cupom>,
  ) {}

  async findById(id: string): Promise<Cupom | null> {
    return await this.repository.findOne({
      where: { id },
    });
  }

  async findByCodigo(codigo: string): Promise<Cupom | null> {
    return await this.repository.findOne({
      where: { codigo },
    });
  }

  async findAtivos(): Promise<Cupom[]> {
    const agora = new Date();
    return await this.repository
      .createQueryBuilder('cupom')
      .where('cupom.ativo = true')
      .andWhere('cupom.dataValidade >= :agora', { agora })
      .andWhere('cupom.vezesUsado < cupom.limitesUso')
      .orderBy('cupom.dataValidade', 'ASC')
      .getMany();
  }

  async findValidos(): Promise<Cupom[]> {
    const agora = new Date();
    return await this.repository
      .createQueryBuilder('cupom')
      .where('cupom.ativo = true')
      .andWhere('cupom.dataValidade >= :agora', { agora })
      .andWhere('cupom.vezesUsado < cupom.limitesUso')
      .orderBy('cupom.dataValidade', 'ASC')
      .getMany();
  }

  async findExpirandoEm(dias: number): Promise<Cupom[]> {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + dias);
    
    const agora = new Date();
    
    return await this.repository
      .createQueryBuilder('cupom')
      .where('cupom.ativo = true')
      .andWhere('cupom.dataValidade >= :agora', { agora })
      .andWhere('cupom.dataValidade <= :dataLimite', { dataLimite })
      .andWhere('cupom.vezesUsado < cupom.limitesUso')
      .orderBy('cupom.dataValidade', 'ASC')
      .getMany();
  }

  async save(cupom: Cupom): Promise<Cupom> {
    return await this.repository.save(cupom);
  }

  async update(id: string, dados: Partial<Cupom>): Promise<void> {
    await this.repository.update(id, dados);
  }

  async delete(id: string): Promise<void> {
    await this.repository.update(id, { ativo: false });
  }

  async incrementarUso(id: string): Promise<void> {
    await this.repository.increment({ id }, 'vezesUsado', 1);
  }

  async count(): Promise<number> {
    return await this.repository.count({ where: { ativo: true } });
  }

  async countValidos(): Promise<number> {
    const agora = new Date();
    return await this.repository
      .createQueryBuilder('cupom')
      .where('cupom.ativo = true')
      .andWhere('cupom.dataValidade >= :agora', { agora })
      .andWhere('cupom.vezesUsado < cupom.limitesUso')
      .getCount();
  }
}
