import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Endereco } from '../common/entities/endereco.entity';

@Injectable()
export class EnderecosService {
  constructor(
    @InjectRepository(Endereco)
    private readonly enderecoRepository: Repository<Endereco>,
  ) {}

  create(endereco: Endereco): Promise<Endereco> {
    return this.enderecoRepository.save(endereco);
  }

  findAll(): Promise<Endereco[]> {
    return this.enderecoRepository.find();
  }

  findOne(id: number): Promise<Endereco | null> {
    return this.enderecoRepository.findOneBy({ enderecoId : id });
  }

  async update(id: number, endereco: Partial<Endereco>): Promise<Endereco | null> {
    const existingEndereco = await this.findOne(id);
    if (!existingEndereco) return null;
    Object.assign(existingEndereco, endereco);
    return this.enderecoRepository.save(existingEndereco);
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.enderecoRepository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }
}