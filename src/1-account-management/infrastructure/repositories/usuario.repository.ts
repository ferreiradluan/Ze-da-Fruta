import { EntityRepository, Repository } from 'typeorm';
import { Usuario } from '../../domain/entities/usuario.entity';

@EntityRepository(Usuario)
export class UsuarioRepository extends Repository<Usuario> {
  async findByEmail(email: string): Promise<Usuario | undefined> {
    const user = await this.findOne({ where: { email } });
    return user || undefined;
  }
  async findById(id: string): Promise<Usuario | undefined> {
    const user = await this.findOne({ where: { id } });
    return user || undefined;
  }
}
