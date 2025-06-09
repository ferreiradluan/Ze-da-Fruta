import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/core/base.entity';
import * as bcrypt from 'bcrypt';

@Entity()
export class Admin extends BaseEntity {  @Column({ unique: true })
  email: string;
  @Column()
  nome: string;
  @Column({ type: 'text', nullable: true })
  fotoPerfil: string | null; // URL/caminho da foto de perfil

  @Column()
  senhaHash: string;

  async verificarSenha(senhaFornecida: string): Promise<boolean> {
    return bcrypt.compare(senhaFornecida, this.senhaHash);
  }
}
