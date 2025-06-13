import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Endereco } from '../common/entities/endereco.entity';

@Injectable()
export class AccountEnderecosService {
  constructor(
    @InjectRepository(Endereco)
    private readonly enderecoRepository: Repository<Endereco>,
  ) {}

  create(endereco: Endereco) {
    return this.enderecoRepository.save(endereco);
  }

  findAllByUser(userId: number) {
    return this.enderecoRepository.find({ where: { user: { userId } } });
  }

  findOneByUser(userId: number, enderecoId: number) {
    return this.enderecoRepository.findOne({ where: { enderecoId, user: { userId } } });
  }

  updateByUser(userId: number, enderecoId: number, endereco: Partial<Endereco>) {
    return this.enderecoRepository.update({ enderecoId, user: { userId } }, endereco);
  }

  removeByUser(userId: number, enderecoId: number) {
    return this.enderecoRepository.delete({ enderecoId, user: { userId } });
  }
}
