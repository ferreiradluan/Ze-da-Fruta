import { Admin } from '../../domain/entities/admin.entity';
import { DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminRepository extends Repository<Admin> {
  constructor(dataSource: DataSource) {
    super(Admin, dataSource.createEntityManager());
  }

  async findByEmail(email: string): Promise<Admin | undefined> {
    const admin = await this.findOne({ where: { email } });
    return admin === null ? undefined : admin;
  }

  async findAll(): Promise<any[]> {
    return this.find();
  }

  /**
   * Garante que o admin padrão existe no banco de dados.
   * Se não existir, cria com email: zedafruta@admin.com e senha: zedafruta321
   */
  async ensureDefaultAdmin() {
    const admin = await this.findByEmail('zedafruta@admin.com');
    if (!admin) {
      const bcrypt = require('bcrypt');
      const senhaHash = await bcrypt.hash('zedafruta321', 10);
      await this.save({
        email: 'zedafruta@admin.com',
        nome: 'Administrador',
        senhaHash,
      });
    }
  }
}
