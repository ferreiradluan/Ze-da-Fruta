import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/core/base.entity';
import { Usuario } from './usuario.entity';

@Entity('enderecos')
export class Endereco extends BaseEntity {
  @Column({ type: 'varchar' })
  apelido: string;

  @Column({ type: 'varchar' })
  rua: string;

  @Column({ type: 'varchar' })
  numero: string;

  @Column({ type: 'varchar', nullable: true })
  complemento?: string;

  @Column({ type: 'varchar' })
  bairro: string;

  @Column({ type: 'varchar' })
  cidade: string;

  @Column({ type: 'varchar' })
  estado: string;

  @Column({ type: 'varchar' })
  cep: string;

  @Column({ type: 'decimal', nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', nullable: true })
  longitude?: number;

  @Column({ type: 'boolean', default: false })
  principal: boolean;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @ManyToOne(() => Usuario, (usuario) => usuario.enderecos, { onDelete: 'CASCADE' })
  usuario: Usuario;

  // === MÉTODOS DE DOMÍNIO RICO ===
  definirComoPrincipal(): void {
    this.principal = true;
  }

  desativar(): void {
    this.ativo = false;
  }

  isPrincipal(): boolean {
    return this.principal;
  }

  isAtivo(): boolean {
    return this.ativo;
  }
}
