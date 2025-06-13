import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/core/base.entity';
import * as bcrypt from 'bcrypt';

@Entity('admins')
export class Admin extends BaseEntity {
  @Column({ type: 'varchar' })
  nome!: string;

  @Column({ type: 'varchar', unique: true })
  email!: string;

  @Column({ type: 'varchar' })
  senhaHash!: string;

  @Column({ type: 'varchar', default: 'ATIVO' })
  status!: string; // 'ATIVO' | 'INATIVO'

  @Column({ type: 'timestamp', nullable: true })
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
    this.status = 'INATIVO';
  }

  ativar(): void {
    this.status = 'ATIVO';
  }

  isAtivo(): boolean {
    return this.status === 'ATIVO';
  }

  registrarLogin(): void {
    this.ultimoLogin = new Date();
  }
}
