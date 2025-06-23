import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/core/base.entity';
import * as bcrypt from 'bcryptjs';
import { STATUS_USUARIO, StatusUsuario } from '../types/status-usuario.types';

@Entity('admins')
export class Admin extends BaseEntity {
  @Column({ type: 'varchar' })
  nome!: string;

  @Column({ type: 'varchar', unique: true })
  email!: string;

  @Column({ type: 'varchar' })
  senhaHash!: string;
  @Column({ type: 'varchar', default: STATUS_USUARIO.ATIVO })
  status!: StatusUsuario;
  @Column({ type: 'datetime', nullable: true })
  ultimoLogin?: Date;

  // === MÉTODOS DE DOMÍNIO RICO ===

  async verificarSenha(senha: string): Promise<boolean> {
    return bcrypt.compare(senha, this.senhaHash);
  }

  async definirSenha(novaSenha: string): Promise<void> {
    const saltRounds = 12;
    this.senhaHash = await bcrypt.hash(novaSenha, saltRounds);
  }

  desativar(): void {
    this.status = STATUS_USUARIO.INATIVO;
  }

  ativar(): void {
    this.status = STATUS_USUARIO.ATIVO;
  }

  isAtivo(): boolean {
    return this.status === STATUS_USUARIO.ATIVO;
  }

  registrarLogin(): void {
    this.ultimoLogin = new Date();
  }
}
