import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Entrega } from '../common/entities/entrega.entity';

@Injectable()
export class EntregasService {
  constructor(
    @InjectRepository(Entrega)
    private readonly entregaRepository: Repository<Entrega>,
  ) {}

  findAll(): Promise<Entrega[]> {
    return this.entregaRepository.find();
  }

  findOne(id: number): Promise<Entrega | null> {
    return this.entregaRepository.findOneBy({ entregaId: id });
  }

  create(entrega: Partial<Entrega>): Promise<Entrega> {
    const newEntrega = this.entregaRepository.create(entrega);
    return this.entregaRepository.save(newEntrega);
  }

  async update(id: number, entrega: Partial<Entrega>): Promise<Entrega | null> {
    const existingEntrega = await this.findOne(id);
    if (!existingEntrega) return null;
    Object.assign(existingEntrega, entrega);
    return this.entregaRepository.save(existingEntrega);
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.entregaRepository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }
}