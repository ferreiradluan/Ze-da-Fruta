import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AccountProfileService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findById(userId: number) {
    return this.usersRepository.findOne({ where: { id: userId } });
  }

  update(userId: number, updateUserDto: Partial<User>) {
    return this.usersRepository.update(userId, updateUserDto);
  }

  remove(userId: number) {
    return this.usersRepository.delete(userId);
  }

  // Novo: listar endereços do usuário
  async getEnderecos(userId: number) {
    const user = await this.usersRepository.findOne({ where: { id: userId }, relations: ['enderecos'] });
    return user?.enderecos || [];
  }

  // Novo: adicionar endereço ao usuário
  async addEndereco(userId: number, enderecoDto: any) {
    const user = await this.usersRepository.findOne({ where: { id: userId }, relations: ['enderecos'] });
    if (!user) throw new Error('Usuário não encontrado');
    user.enderecos = [...(user.enderecos || []), enderecoDto];
    await this.usersRepository.save(user);
    return user.enderecos;
  }
}
