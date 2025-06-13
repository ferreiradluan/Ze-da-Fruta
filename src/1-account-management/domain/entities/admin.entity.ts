import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/core/base.entity';
import * as bcrypt from 'bcrypt';

@Entity()
export class Admin extends BaseEntity {
  @Column()
  nome: string;

  @Column({ unique: true })
  email: string;

  @Column()
  senhaHash: string;

  // Método de negócio conforme diagrama
  verificarSenha(senha: string): boolean {
    return bcrypt.compareSync(senha, this.senhaHash);
  }
}
