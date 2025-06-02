import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cupom } from '../common/entities/cupom.entity';

@Injectable()
export class CuponsService {
  constructor(
    @InjectRepository(Cupom)
    private readonly cupomRepository: Repository<Cupom>,
  ) {}

  create(cupom: Cupom): Promise<Cupom> {
    return this.cupomRepository.save(cupom);
  }

  findAll(): Promise<Cupom[]> {
    return this.cupomRepository.find();
  }

  findOne(id: number): Promise<Cupom | null> {
    // Replace 'id' with the actual primary key property of Cupom, e.g., 'cupomId'
    return this.cupomRepository.findOneBy({ cupomId: id });
  }

  async update(id: number, cupom: Partial<Cupom>): Promise<Cupom | null> {
    const existingCupom = await this.findOne(id);
    if (!existingCupom) return null;
    Object.assign(existingCupom, cupom);
    return this.cupomRepository.save(existingCupom);
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.cupomRepository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }
}