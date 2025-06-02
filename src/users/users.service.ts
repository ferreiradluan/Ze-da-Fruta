import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserProfileType } from './entities/user.entity';

export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  senha?: string;
  picture?: string;
  provider?: string;
  isEmailVerified?: boolean;
  role?: UserRole;
  profileType?: UserProfileType;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const user = this.usersRepository.create({
        ...createUserDto,
        role: createUserDto.role || UserRole.USER,
        profileType: createUserDto.profileType || UserProfileType.CUSTOMER,
        isEmailVerified: createUserDto.isEmailVerified || false,
        provider: createUserDto.senha ? 'local' : (createUserDto.provider || 'google'),
      });
      return await this.usersRepository.save(user);
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && error.code === '23505') {
        throw new ConflictException('Email já está em uso');
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(userId: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { userId } });
    if (!user) throw new Error('Usuário não encontrado');
    return user;
  }

  async update(userId: number, updateUserDto: Partial<User>): Promise<User> {
    const user = await this.findById(userId);
    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async remove(userId: number): Promise<void> {
    const user = await this.findById(userId);
    await this.usersRepository.remove(user);
  }

  async findAll(filtro?: any): Promise<User[]> {
    // Exemplo de filtro: { nome, email, perfil, status }
    // Ajuste conforme sua estrutura de entidade
    const where: any = {};
    if (filtro?.nome) where.firstName = filtro.nome;
    if (filtro?.email) where.email = filtro.email;
    // Adicione outros filtros conforme necessário
    return this.usersRepository.find({ where });
  }

  async findOneDetalhado(userId: number): Promise<User | null> {
    // Retorna o usuário com perfis e histórico de pedidos (ajuste relations conforme necessário)
    return this.usersRepository.findOne({ where: { userId }, relations: ['perfis'] });
  }

  async alterarStatus(userId: number, status: string): Promise<User> {
    const user = await this.findById(userId);
    user.status = status;
    return this.usersRepository.save(user);
  }

  async alterarPerfis(userId: number, perfis: string[]): Promise<User> {
    const user = await this.findById(userId);
    // Ajuste conforme sua lógica de perfis
    // user.perfis = perfis;
    return this.usersRepository.save(user);
  }
}