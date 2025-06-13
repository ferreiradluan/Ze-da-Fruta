import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/core/base.entity';
import { Usuario } from './usuario.entity';

@Entity('perfis_usuario')
export class PerfilUsuario extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  telefone?: string;

  @Column({ type: 'varchar', nullable: true })
  documento?: string; // CPF/CNPJ

  @Column({ type: 'varchar', nullable: true })
  tipoDocumento?: string; // 'CPF' | 'CNPJ'

  @Column({ type: 'date', nullable: true })
  dataNascimento?: Date;

  @Column({ type: 'varchar', nullable: true })
  genero?: string; // 'M' | 'F' | 'OUTRO' | 'NAO_INFORMADO'

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ type: 'varchar', default: 'INCOMPLETO' })
  statusPerfil: string; // 'COMPLETO' | 'INCOMPLETO' | 'VERIFICADO'

  @Column({ type: 'boolean', default: false })
  emailVerificado: boolean;

  @Column({ type: 'boolean', default: false })
  telefoneVerificado: boolean;

  @Column({ type: 'boolean', default: false })
  documentoVerificado: boolean;

  // Composição: Perfil é parte do Usuário (1:1)
  @OneToOne(() => Usuario, (usuario) => usuario.perfil, { onDelete: 'CASCADE' })
  @JoinColumn()
  usuario: Usuario;

  // === MÉTODOS DE DOMÍNIO RICO ===

  isCompleto(): boolean {
    return this.statusPerfil === 'COMPLETO';
  }

  isVerificado(): boolean {
    return this.statusPerfil === 'VERIFICADO';
  }

  isIncompleto(): boolean {
    return this.statusPerfil === 'INCOMPLETO';
  }

  completarPerfil(): void {
    if (this.telefone && this.documento && this.tipoDocumento) {
      this.statusPerfil = 'COMPLETO';
    }
  }

  verificarPerfil(): void {
    if (this.isCompleto() && this.emailVerificado && this.documentoVerificado) {
      this.statusPerfil = 'VERIFICADO';
    }
  }

  verificarEmail(): void {
    this.emailVerificado = true;
    this.verificarSeDeveAtualizar();
  }

  verificarTelefone(): void {
    this.telefoneVerificado = true;
    this.verificarSeDeveAtualizar();
  }

  verificarDocumento(): void {
    this.documentoVerificado = true;
    this.verificarSeDeveAtualizar();
  }

  private verificarSeDeveAtualizar(): void {
    if (this.isIncompleto()) {
      this.completarPerfil();
    }
    if (this.isCompleto()) {
      this.verificarPerfil();
    }
  }
}
