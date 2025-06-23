import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../../domain/entities/usuario.entity';

@Injectable()
export class UsuarioRepository {
  constructor(
    @InjectRepository(Usuario)
    private readonly repository: Repository<Usuario>,
  ) {}
  create(userData?: Partial<Usuario>): Usuario {
    return this.repository.create(userData || {});
  }

  async save(usuario: Usuario): Promise<Usuario> {
    return this.repository.save(usuario);
  }

  async findOne(options: any): Promise<Usuario | null> {
    return this.repository.findOne(options);
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    return this.repository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<Usuario | null> {
    return this.repository.findOne({ where: { id } });
  }

  async find(options?: any): Promise<Usuario[]> {
    return this.repository.find(options);
  }

  async remove(usuario: Usuario): Promise<Usuario> {
    return this.repository.remove(usuario);
  }

  async delete(criteria: any): Promise<any> {
    return this.repository.delete(criteria);
  }
}
