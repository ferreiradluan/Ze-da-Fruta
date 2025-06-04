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
    return this.usersRepository.findOne({ where: { userId } });
  }

  update(userId: number, updateUserDto: Partial<User>) {
    return this.usersRepository.update(userId, updateUserDto);
  }

  remove(userId: number) {
    return this.usersRepository.delete(userId);
  }
}
