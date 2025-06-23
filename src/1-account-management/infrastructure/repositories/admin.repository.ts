import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from '../../domain/entities/admin.entity';

@Injectable()
export class AdminRepository {
  constructor(
    @InjectRepository(Admin)
    private readonly repository: Repository<Admin>,
  ) {}

  create(adminData?: Partial<Admin>): Admin {
    return this.repository.create(adminData || {});
  }

  async save(admin: Admin | Partial<Admin>): Promise<Admin> {
    return this.repository.save(admin);
  }

  async findOne(options: any): Promise<Admin | null> {
    return this.repository.findOne(options);
  }

  async findByEmail(email: string): Promise<Admin | null> {
    return this.repository.findOne({ where: { email } });
  }

  async findAll(): Promise<Admin[]> {
    return this.repository.find();
  }

  async find(options?: any): Promise<Admin[]> {
    return this.repository.find(options);
  }

  async remove(admin: Admin): Promise<Admin> {
    return this.repository.remove(admin);
  }

  async delete(criteria: any): Promise<any> {
    return this.repository.delete(criteria);
  }

  /**
   * Garante que o admin padrão existe no banco de dados.
   * Se não existir, cria com email: zedafruta@admin.com e senha: zedafruta321
   */
  async ensureDefaultAdmin() {
    const admin = await this.findByEmail('zedafruta@admin.com');
    if (!admin) {
      const bcrypt = require('bcryptjs');
      const senhaHash = await bcrypt.hash('zedafruta321', 10);
      await this.save({
        email: 'zedafruta@admin.com',
        nome: 'Administrador',
        senhaHash,
      });
    }
  }
}
