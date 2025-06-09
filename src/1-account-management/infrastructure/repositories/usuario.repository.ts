import { Injectable } from '@nestjs/common';
import { Repository, Like, LessThan, Between, In, Not, IsNull } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { IUsuarioRepository } from '../../domain/repositories/usuario.repository.interface';
import { Usuario, StatusUsuario, TipoUsuario } from '../../domain/entities/usuario.entity';
import { IPaginationResult, IQueryOptions } from '../../../common/domain/repositories/domain-repository.interface';

/**
 * TypeORM implementation of Usuario repository
 * Implements domain repository interface with infrastructure concerns
 */
@Injectable()
export class UsuarioRepository implements IUsuarioRepository {
  constructor(
    @InjectRepository(Usuario)
    private readonly repository: Repository<Usuario>
  ) {}

  // ===== BASIC CRUD OPERATIONS =====

  async create(entity: Usuario): Promise<Usuario> {
    return await this.repository.save(entity);
  }

  async update(entity: Usuario): Promise<Usuario> {
    return await this.repository.save(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findById(id: string): Promise<Usuario | null> {
    return await this.repository.findOne({
      where: { id: id },
      relations: ['roles', 'enderecos', 'perfis']
    });
  }

  async findAll(): Promise<Usuario[]> {
    return await this.repository.find({
      relations: ['roles', 'enderecos', 'perfis']
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id: id } });
    return count > 0;
  }

  // ===== ADVANCED REPOSITORY METHODS =====

  async findWithOptions(options: any): Promise<Usuario[]> {
    return await this.repository.find({
      ...options,
      relations: ['roles', 'enderecos', 'perfis']
    });
  }

  async findMany(ids: string[]): Promise<Usuario[]> {
    return await this.repository.find({
      where: { id: In(ids) },
      relations: ['roles', 'enderecos', 'perfis']
    });
  }

  async remove(entity: Usuario): Promise<void> {
    await this.repository.remove(entity);
  }

  async removeById(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  // ===== AGGREGATE ROOT PATTERN =====

  async saveAggregate(usuario: Usuario): Promise<Usuario> {
    // Save the aggregate
    const savedUsuario = await this.repository.save(usuario);
    
    // Get uncommitted events if available
    if (usuario['_aggregateRoot'] && typeof usuario['_aggregateRoot'].getUncommittedEvents === 'function') {
      const events = usuario['_aggregateRoot'].getUncommittedEvents();
      
      // Dispatch events (in real implementation, this would use proper event dispatcher)
      for (const event of events) {
        console.log(`Dispatching event: ${event.eventName || event.constructor.name}`, event);
        // TODO: Integrate with actual domain event dispatcher
      }
      
      // Mark events as committed
      if (typeof usuario['_aggregateRoot'].markEventsAsCommitted === 'function') {
        usuario['_aggregateRoot'].markEventsAsCommitted();
      }
    }
    
    return savedUsuario;
  }

  // ===== DOMAIN-SPECIFIC QUERIES =====

  async findByEmail(email: string): Promise<Usuario | null> {
    return await this.repository.findOne({
      where: { email },
      relations: ['roles', 'enderecos', 'perfis']
    });
  }

  async findByCpf(cpf: string): Promise<Usuario | null> {
    return await this.repository.findOne({
      where: { cpf },
      relations: ['roles', 'enderecos', 'perfis']
    });
  }

  async emailExists(email: string): Promise<boolean> {
    const count = await this.repository.count({ where: { email } });
    return count > 0;
  }

  async cpfExists(cpf: string): Promise<boolean> {
    if (!cpf) return false;
    const count = await this.repository.count({ where: { cpf } });
    return count > 0;
  }

  async findByTipo(tipo: TipoUsuario): Promise<Usuario[]> {
    return await this.repository.find({
      where: { tipo },
      relations: ['roles', 'enderecos', 'perfis']
    });
  }

  async findByStatus(status: StatusUsuario): Promise<Usuario[]> {
    return await this.repository.find({
      where: { status },
      relations: ['roles', 'enderecos', 'perfis']
    });
  }

  async findByTipoAndStatus(tipo: TipoUsuario, status: StatusUsuario): Promise<Usuario[]> {
    return await this.repository.find({
      where: { tipo, status },
      relations: ['roles', 'enderecos', 'perfis']
    });
  }

  async findActiveUsers(): Promise<Usuario[]> {
    return await this.repository.find({
      where: { status: StatusUsuario.ATIVO },
      relations: ['roles', 'enderecos', 'perfis']
    });
  }

  async findUsersWithExpiredResetTokens(): Promise<Usuario[]> {
    return await this.repository.find({
      where: {
        dataExpiracaoTokenReset: LessThan(new Date()),
        tokenResetSenha: Not(IsNull()),
      },
      relations: ['roles', 'enderecos', 'perfis']
    });
  }

  async findSuspendedUsersUntil(date: Date): Promise<Usuario[]> {
    return await this.repository.find({
      where: {
        status: StatusUsuario.SUSPENSO,
        // Add suspension end date field if needed in the future
        // suspensaoAte: LessThan(date)
      },
      relations: ['roles', 'enderecos', 'perfis']
    });
  }

  async searchByNameOrEmail(searchTerm: string): Promise<Usuario[]> {
    return await this.repository.find({
      where: [
        { nome: Like(`%${searchTerm}%`) },
        { email: Like(`%${searchTerm}%`) }
      ],
      relations: ['roles', 'enderecos', 'perfis']
    });
  }

  async findWithFilters(options: IQueryOptions): Promise<IPaginationResult<Usuario>> {
    // Default pagination values
    const page = (options as any).page || 1;
    const limit = (options as any).limit || 10;
    const skip = (page - 1) * limit;

    const [items, total] = await this.repository.findAndCount({
      where: (options as any).where,
      skip,
      take: limit,
      order: (options as any).orderBy,
      relations: ['roles', 'enderecos', 'perfis']
    });

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1
    };
  }

  async countByTipo(tipo: TipoUsuario): Promise<number> {
    return await this.repository.count({ where: { tipo } });
  }

  async countByStatus(status: StatusUsuario): Promise<number> {
    return await this.repository.count({ where: { status } });
  }

  async findInactiveUsersSince(date: Date): Promise<Usuario[]> {
    return await this.repository.find({
      where: {
        dataUltimoLogin: LessThan(date)
      },
      relations: ['roles', 'enderecos', 'perfis']
    });
  }

  async findUsersWithRoles(roleNames: string[]): Promise<Usuario[]> {
    return await this.repository
      .createQueryBuilder('usuario')
      .leftJoinAndSelect('usuario.roles', 'role')
      .leftJoinAndSelect('usuario.enderecos', 'enderecos')
      .leftJoinAndSelect('usuario.perfis', 'perfis')
      .where('role.nome IN (:...roleNames)', { roleNames })
      .getMany();
  }

  async findUsersCreatedBetween(startDate: Date, endDate: Date): Promise<Usuario[]> {
    return await this.repository
      .createQueryBuilder('usuario')
      .leftJoinAndSelect('usuario.roles', 'roles')
      .leftJoinAndSelect('usuario.enderecos', 'enderecos')
      .leftJoinAndSelect('usuario.perfis', 'perfis')
      .where('usuario.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate
      })
      .getMany();
  }
}
